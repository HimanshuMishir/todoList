//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/todoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Go to Market."
});
const item2 = new Item({
  name: "Bring some Bananas."
});
const item3 = new Item({
  name: "Try some new coding skills."
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();
app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, (err) => {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });
});


app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect(`/${customListName}`);
      } else {

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });



});


app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, (err, foundList) =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

  
});

app.post("/delete", (req, res) => {
  const checkedItem = req.body.checkbox;
const listName = req.body.listName;
if(listName ===day){

  Item.findByIdAndDelete(checkedItem, (err) => {
    if (err) return handleError(err);
  });
  res.redirect("/");
}else{
  List.findOneAndUpdate({name: listName},{$pull:{items: {_id: checkedItem}}},(err ,foundList)=>{
    if(!err){
      res.redirect(`/${listName}`)
    }
    else{
      console.log(err)
    }
  })
}
});


/* app.get("/work", (req, res) => {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", (req, res) => {
  res.render("about");
}); */

app.listen(3000, () => {
  console.log("Server started on port 3000");
});