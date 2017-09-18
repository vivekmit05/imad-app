var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool= require('pg').Pool;
var crypto = require('crypto');

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
    return ['pdkdf2','salt','10000',hashed.toString('hex')].join('&');
}
app.get('/hash/:input',function(req,res){
    var hashedString=hash(req.params.input,'this-is-a-salt-value');
    res.send(hashedString);
});

// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
