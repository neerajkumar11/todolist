//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://admin-neeraj:toughPassword@cluster0.mxn2b.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to our todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete a item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){

  Item.find({}, function(err, result){

    if(result.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Successfuly inserted items");
        };
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newItems: result});
    };
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, results){
    if(!err){
      if(! results){
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName);

      } else {
        // Show an existing list
        res.render("list", {listTitle: results.name, newItems: results.items});
      }
    }
  });
});



app.post("/", function(request, response){
  let itemName = request.body.newToDo;
  let listName = request.body.button;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    response.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      response.redirect("/"+listName);
    })
  }
});


app.get("/about", function(req,res){
  res.render("about");
});

app.post("/delete", function(request, response){
  const checkedItemId = request.body.checkedItem;
  const listName = request.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Successfully delete item");
      }
    });
    response.redirect("/")
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
      if(!err){
        response.redirect("/"+listName);
      };
    });
  };
});


app.listen(3000, function(){
  console.log("Server Running");
})
