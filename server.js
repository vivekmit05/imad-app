var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool= require('pg').Pool;
var crypto = require('crypto');
var bodyParser=require('body-parser');
var session=require('express-session');

var config={
    user:'vivekmit05',
    database:'vivekmit05',
    host:'db.imad.hasura-app.io',
    port:'5432',
    password:process.env.DB_PASSWORD
};
var pool=new Pool(config);//created pool globally.

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());//Asking "express app" that in case you see JSON content load that JSON content into "req.body" variable
app.use(session({
    secret:'SomeRandomSecretValue',
    cookie:{maxAge:1000*60*60*24*30}
}));

//Article objects used to create template
var articles={
  'article-one':{
                title:'Article-one | Vivek Mishra',
                heading: 'Article One',
                date: 'Sep, 10, 2017',
                content:`
                            <p>
                                 This is 1st paragraph of article one.
                             </p>
                             <p>
                                 This is 2nd paragraph of article one.
                             </p>`
  },
  'article-two':{
                title:'Article-two | Vivek Mishra',
                heading: 'Article Two',
                date: 'Sep, 11, 2017',
                content:`
                            <p>
                                 This is 1st paragraph of article two.
                             </p>
                             <p>
                                 This is 2nd paragraph of article two.
                             </p>`
  },
  'article-three':{
                title:'Article-three | Vivek Mishra',
                heading: 'Article Three',
                date: 'Sep, 13, 2017',
                content:`
                            <p>
                                 This is 1st paragraph of article three.
                             </p>
                             <p>
                                 This is 2nd paragraph of article three.
                             </p>`
  }
};

//createTemplate function that creates html template based on article objects provided to it
function createTemplate(data){
var title=data.title;
var heading=data.heading;
var date=data.date;
var content=data.content;

var htmlTemplate=`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <link href="/ui/style.css" rel="stylesheet"/>
      </head>
      <body>
          <div class="container">
              <div>
                  <a href="/">Home</a>
                </div>
                <hr>
                <h3>
                    ${heading}
                </h3>
                <div>
                    ${date}
                </div>
             <div>
                 ${content}
             </div>
          </div>
      </body>
    </html>
    `;
    return htmlTemplate;

}

//End point to create counter for number of times this endpoint is accessed
var counter=0;
app.get('/counter',function(req,res){
  counter=counter+1;
  res.send(counter.toString());
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});


var names=[];
app.get('/submit-name',function(req,res){///submit-name?name=xxxxxx
  var nameVal=req.query.name;
  names.push(nameVal);
  res.send(JSON.stringify(names));
});

app.get('/:articleName',function(req,res){
  var articleName=req.params.articleName;
  res.send(createTemplate(articles[articleName]));
});


// endpoint to test data connection with the DB
//make a select request and return the response with the result
app.get('/testDB',function(req,res){ 
    pool.query('SELECT * FROM test',function(err,result){
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            res.send(JSON.stringify(result.rows));
        }
    });
});

app.get('/articles/:articleName',function(req,res){
  var articleName=req.params.articleName;
  pool.query("SELECT * FROM articles WHERE heading=$1",[articleName],function(err,result){
      if(err){
          res.status(500).send(err.toString());
      }
      else{
          if(result.rows.length===0){
              res.status(404).send('Article not found');
          }
          else{
              var articleData=result.rows[0];
               res.send(createTemplate(articleData));
          }
      }
  });
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});

// app.get('/ui/main.js', function (req, res) {
//   res.sendFile(path.join(__dirname, 'ui', 'main.js'));
// });

app.get('/ui/main.js',function(req,res){
  res.sendFile(path.join(__dirname,'ui','main.js'));
});

function hash(input,salt){
    var hashed=crypto.pbkdf2Sync(input, salt, 10000, 10, 'sha512');
    return ['pdkdf2',salt,'10000',hashed.toString('hex')].join('$');
}

//End-point to test hash function
app.get('/hash/:input',function(req,res){
    var hashedString=hash(req.params.input,'this-is-a-salt-value');
    res.send(hashedString);
});

//End-point to create User
app.post('/create-user',function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    var salt=crypto.randomBytes(128).toString('hex');
    var dbString=hash(password,salt);
    pool.query('INSERT INTO "user" (username,password) VALUES ($1,$2)',[username,dbString],function(err,result){
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            res.send(username+' user created successfully');
        }
    });
});

app.post('/login',function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    
    pool.query('SELECT * FROM "user" WHERE username=$1',[username],function(err,result){
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            if(result.rows.length===0){
                res.status(403).send('Username is invalid');
            }
            else{
                //Match the password
                var dbString=result.rows[0].password;
                var salt=dbString.split('$')[1];
                var hashedString=hash(password,salt);
                if(hashedString===dbString){
                    //session is created before any response is send
                    req.session.auth={userId: result.rows[0].id}; // internally a session id is created and that is mapped to an
                                                                  // object auth that contains userId {auth:userID}
                                                                  //On the client site a cookie is stored with only session id.
                    
                    res.send('Logged In Successfully');
                }
                else{
                    res.status(403).send(username+' your password is incorrect');
                }
            }
        }
    });
});

//To check session login
app.get('/status/checkLogin',function(req,res){
    if(req.session && req.session.auth && req.session.auth.userId){
        res.send('You are logged in with user Id: '+req.session.auth.userId.toString());
    }
    else{
        res.send('You are not logged in');
    }
});

// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
