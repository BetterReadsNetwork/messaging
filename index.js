var express = require('express');
var app = express();

app.set('view engine', 'ejs');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

var Message = require('./schema/Message.js');
var Chat = require('./schema/Chat.js');
var Block = require('./schema/Block.js');

const url = require('url');

/***************************************/

app.use('/api/block_user/:id', (req, res) => {
    var user = req.params.id;
    var other = req.body.other;
    if (user === other) {
      res.redirect("/chats/" + user);
      return;
    }
    var q = {
        user: user,
        other: other
    }

    Block.find(q, (err, chats) => {
        if (err) {
            res.type('html').status(200);
            console.log('Messaging error' + err);
            res.write(err);
        } else if (chats.length > 0) {
            res.redirect("/messages/" + user);
        } else {
            new_block = new Block(q);
            new_block.save((err) => {
                if (err) {
                    res.type('html').status(200);
                    res.write('Block error: ' + err);
                    console.log(err);
                    res.end();
                } else {
                    res.redirect("/chats/" + user);
                }
            });
        }
    })
});


app.use('/api/unblock_user/:id/:other', (req, res) => {
    var user = req.params.id;
    var other = req.params.other;
    if (user === other) {
      res.redirect("/chats/" + user);
      return;
    }
    var q = {
        user: user,
        other: other
    }

    Block.find(q, (err, chats) => {
        if (err) {
            res.type('html').status(200);
            console.log('Messaging error' + err);
            res.write(err);
        } else if (chats.length > 0) {
            Block.remove(q, (err, blocked) => {
                if (err) {
                    console.log("unblocking error");
                }
            });
        }
        res.redirect("/messages/" + user);
    })
});


/***************************************/
app.use('/api/add_chat/:id', (req, res) => {
    var user = req.params.id;
    var other = req.body.other;
    if (user === other) {
      res.redirect("/chats/" + user);
      return;
    }
    var q = {
        user: user,
        other: other
    }

    Block.find(q, (err, blocks) => {
        if (err) {
            res.type('html').status(200);
            console.log('Messaging error' + err);
            res.write(err);
        } else if (blocks.length > 0) {
            res.redirect("/chats/" + user);
        } else {
            Chat.find(q, (err, chats) => {
                if (err) {
                    res.type('html').status(200);
                    console.log('Messaging error' + err);
                    res.write(err);
                } else if (chats.length > 0) {
                    var dest = "/messages/" + user + '/' + other
                    res.redirect(dest);
                } else {
                    new_chat = new Chat(q);
                    new_chat.save((err) => {
                        if (err) {
                            res.type('html').status(200);
                            res.write('Messaging error: ' + err);
                            console.log(err);
                            res.end();
                        } else {
                            var dest = "/messages/" + user + '/' + other
                            res.redirect(dest);
                        }
                    });
                }
            })
        }
    });
});

/***************************************/

app.use('/api/send_message/:user/:other', (req, res) => {
    var user = req.params.user;
    var other = req.params.other;
    if (user === other) {
      res.redirect("/chats/" + user);
      return;
    }
    var new_message = new Message({
        to_uuid: other,
        from_uuid: user,
        message: req.body.msg,
        ts: Math.floor(Date.now() / 1000)
    });

    new_message.save((err) => {
        if (err) {
            res.type('html').status(200);
            res.write('Messaging error: ' + err);
            console.log(err);
            res.end();
        } else {
            var dest = "/messages/" + user + '/' + other
            res.redirect(dest);
        }
    });
});

app.use('/api/get_messages/:user/:other', (req, res) => {

    var user = req.params.user;
    var other = req.params.other;
    if (user === other) {
      res.redirect("/chats/" + user);
      return;
    }

    var query = {
        "$or": [{
            "from_uuid": user,
            "to_uuid": other
        }, {
            "from_uuid": other,
            "to_uuid": user
        }]
    }

    Message.find(query, (err, msgs) => {
        if (err) {
            res.type('html').status(200);
            console.log('Messaging error' + err);
            res.write(err);
        } else {
            if (msgs.length == 0) {
                res.json({
                    'msgs': {}
                });
                return;
            }
            var json_res = []

            msgs.forEach((msg) => {
                if (msg.to_uuid != user) {
                    var to_me = false;
                } else {
                    var to_me = true;
                }

                json_res.push({
                    "to_me": to_me,
                    "text": msg.message
                });
            });
            res.json({
                'msgs': json_res
            });
        }
    });
});

/***************************************/

app.use('/messages/:user/:other', (req, res) => {

    var user = req.params.user;
    var other = req.params.other;

    var query = {
        "$or": [{
            "from_uuid": user,
            "to_uuid": other
        }, {
            "from_uuid": other,
            "to_uuid": user
        }]
    }

    Message.find(query, (err, msgs) => {
        if (err) {
            res.type('html').status(200);
            console.log('Messaging error' + err);
            res.write(err);
        } else {
            if (msgs.length == 0) {
                res.render('messages', {
                    'msgs': [],
                    user: user,
                    other: other
                });
                return;
            }
            res.render('messages', {
                'msgs': msgs,
                user: user,
                other: other
            });
        }
    });
});

app.use('/chats/:id', (req, res) => {
  var uuid = req.params.id;
  var query = {
      "$or": [{
          user: uuid
      }, {
          other: uuid
      }]
  }
  Chat.find(query, (err, chats) => {
      if (err) {
          res.type('html').status(200);
          console.log('Messaging error' + err);
          res.write(err);
          return;
      }

      if (chats.length == 0) {
          chats = [];
      }

      var chat_ids = [];
      chats.forEach((chat) => {
          if (chat.user == uuid) {
              var block_q = {
                  user: uuid,
                  other: chat.other
              };

              Block.find(block_q, (err, blocks) => {
                  if (err) {
                      res.type('html').status(200);
                      console.log('Messaging error' + err);
                      res.write(err);
                      return;
                  } else if (blocks.length == 0) {
                      chat_ids.push({other:chat.other});
                  }
              });

          } else {
              var block_q = {
                  user: chat.other,
                  other: uuid
              };

              Block.find(block_q, (err, blocks) => {
                  if (err) {
                      res.type('html').status(200);
                      console.log('Messaging error' + err);
                      res.write(err);
                      return;
                  } else if (blocks.length == 0) {
                      chat_ids.push({other:chat.user});
                  }
              });
          }
      });
      Block.find({user:uuid}, (err, blocks) => {
          if (err) {
              res.type('html').status(200);
              console.log('Messaging error' + err);
              res.write(err);
              return;
          } else if (blocks.length == 0) {
              blocks = [];
          }
          res.render('chats', {
              chats: chat_ids,
              uuid: uuid,
              blocked: blocks
          });
      });
  });
});

/*************************************************/

app.use('/', (req, res) => {
    res.redirect('/chats/7');
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
