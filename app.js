const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const day = date();

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
    name: "Hit the + buttin to add a new item."
});

const item3 = new Item({
    name: "<-- hit this to delete an item."
});

const defaultItems = [item1,item2,item3];



// var items=["Buy food", "Cook food", "Eat food"];
var workItems = [];

app.get('/', function(req, res){
    Item.find({}).then(function(foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems).then(function () {
                console.log("Successfully saved defult items to DB");
            }).catch(function (err) {
                console.log(err);
            });
            res.redirect('/');
        }
        else{
            res.render('lists', {listTitle:day, newListItems:foundItems});
        }
    })
});

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get('/:customListName', function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function (foundList) {
        if(!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect('/' + customListName);
        }
        else{
            res.render('lists', {listTitle:foundList.name, newListItems:foundList.items});
        }
    }).catch(function (err) {
        console.log(err);
    });

    
});

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === day){
        item.save();
        res.redirect('/');
    }
    else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(function(err){
            console.log(err);
        });
    }

});

app.post('/delete', function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day){
        Item.findByIdAndRemove(checkedItemId).then(function () {
            console.log("Successfully deleted checked item");
        }).catch(function (err) {
            console.log(err);
        });
        res.redirect('/');
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList){
            res.redirect('/' + listName);
        }).catch(function(err){
            console.log(err);
        });
    }
});


app.listen(3300, function(){
    console.log('connected to port 3300');
})