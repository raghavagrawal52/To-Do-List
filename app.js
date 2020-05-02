const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

let workItems = [];

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser:true,useUnifiedTopology: true});

const itemsSchema={
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your Todolist."
});
const item2 = new Item({
    name: "Hit the + to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema ={
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.set("view engine","ejs");

app.get('/',function(req,res){

    Item.find({},(err,foundItems)=>{

        if(foundItems.length === 0){
            Item.insertMany(defaultItems,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log("Successfully added all the deafult items to the document");
            }
        });
        res.redirect('/');
        }else{
            res.render("list" , {listTitle : "Today", newListItems : foundItems});
        }
    });
});

app.get('/:customListName',(req,res)=>{
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name: customListName},(err,foundList)=>{
        if(!err){
            if(!foundList){
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            }else{
                //show the existing list
                res.render("list",{listTitle : foundList.name, newListItems : foundList.items});
            }
        }

    });

   
})

app.get('/about', function(req,res){
    res.render("about");
})

app.post('/',(req,res)=>{
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name: listName},(err,foundList)=>{
            foundList.items.push(item);
            foundList.save();
            res.redirect('/'+listName);
        })
    }

})

app.post('/delete',(req,res)=>{
    const checkedItemId = req.body.checkbox;
    const listName = req.body.list;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId,(err)=>{
            if(!err){
                res.redirect('/');
            }
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},(err,foundList)=>{
           if(!err){
                res.redirect('/'+ listName);
           }
        })
    }
    
} )

app.listen(3000, function(){
    console.log("Server is running at port 3000.");
})