const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {Schema} = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb+srv://TuanPhan:Koala1989@cluster0.qrpwlc5.mongodb.net/todolistDB');
}

const itemsSchema = new mongoose.Schema({
  name: String
})
const Item = new mongoose.model("Item", itemsSchema);
const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item"});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {
    if (!foundItems) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }else {
          console.log("Items added.");
        }
      })
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })

})

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: itemName});

  if (listName === "Today") {
    newItem.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      if(!err) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      }else {
        console.log("Deleted one item!")
      }
    });
    res.redirect("/")
  }else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}, (err, foundList) => {
      console.log(Item);
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
  console.log(listName)
})

app.listen(3000, () => console.log("Server started on port 3000"));