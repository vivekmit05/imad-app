// console.log('Loaded!');
var button=document.getElementById("counter");

button.onclick=function(){
	//Create a request object
	var request=new XMLHttpRequest();

	//Capture the response and store it in a variable
	request.onreadystatechange=function(){
		if(request.readyState===XMLHttpRequest.DONE){
			//Take some action
			if(request.status===200){
				var counter=request.responseText;
				var span=document.getElementById("count");
				span.innerHTML=counter.toString();
			}
		}
		//Not done yet
	}

	//Make the request
	request.open('GET','counter',true);
	request.send(null);
};

//code for adding text box values as a list on the index page
var submitBtn=document.getElementById("submit_btn");
submitBtn.onclick=function(){
	//Create a request object
	var request=new XMLHttpRequest();

	//Capture the response and store it in a variable
	request.onreadystatechange=function(){
		if(request.readyState===XMLHttpRequest.DONE){
			if(request.status===200){
				//Capture a list of names and render it as a list
				var names=request.responseText;
				names=JSON.parse(names); // Converting string to original object in this case array
				var list='';  //all the <li> elements will be added as a string to this variable using loop
				for(var i=0;i<names.length;i++){
					list+='<li>'+names[i]+'</li>';
				}
				var listNames=document.getElementById("nameList");
				listNames.innerHTML=list;
			}
		}
	}
	var nameInput=document.getElementById("name");
	var name=nameInput.value;
	//Make the request
	request.open('GET','submit-name?name='+name,true); // url can also be like 'http:abc.com/submit-name?name='
	request.send(null);
	nameInput.value="";

};

//Login
var loginSubmitBtn=document.getElementById("login_submit_btn_ID");
loginSubmitBtn.onclick=function(){
	//Create a request object
	var request=new XMLHttpRequest();

	//Capture the response and store it in a variable
	request.onreadystatechange=function(){
		if(request.readyState===XMLHttpRequest.DONE){
			if(request.status===200){
			    alert('Logged In Successfully');
			}
			else if(request.status===403){
			    alert('Username / Password is incorrect');
			}
			else if(request.status===500){
			    alert('Something went wrong on the server');
			}
		}
	}
	var uname=document.getElementById("username_ID");
	var username=uname.value;
	var pwd=document.getElementById("password_ID");
	var password=pwd.value;
	//Make the request
	request.open('POST','login',true); // url can also be like 'http:abc.com/submit-name?name='
	request.setRequestHeader('Content-Type','application/json');
	request.send(JSON.stringify({username:username,password:password}));
	nameInput.value="";

};