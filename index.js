var express = require('express')
var app = express()
var bodyParser = require('body-parser')

const s3 = require('./lib_s3')
const pg = require('./lib_pg')

// configure
// make sure there are ENV vars set for s3: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
const bucket = 'front-matter-extractor'
// the function to turn your jpg file name into the alto xml filename
const jpgToAXml = function(jpg){ return jpg.split('_')[0] + '_redacted_ALTO_' + jpg.split('_')[1] + '_'  + jpg.split('_')[2].replace(/.jpg$/i,'.xml')}
// current goal
const goal = "Illinois State Judges"





// ----


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



pg.init()




// load the list of dirs
var workList = []
s3.list(bucket, (results) =>{
	workList = results
	pg.populateWorkList(results)
})





// routes

app.get('/', function(request, response) {

	pg.getStatus((status)=>{

		response.render('pages/index', {goal:goal, status:status});		
	})
  
});

app.get('/work/download', function(request, response) {

	pg.dump((dump)=>{

	    response.setHeader('Content-Type', 'application/json');
	    response.send(JSON.stringify(dump, null, 3));

	})
  
});

app.get('/work', function(request, response) {
	pg.query("SELECT * FROM work WHERE complete = false order by random() LIMIT 1",[],(error,results)=>{
		if (results[0] && results[0].refid){		
			response.redirect(`/work/${results[0].refid}`);

		}else{
			response.send('No Work!')
		}
	})
});


app.get('/work/:refid/:imageId', function(request, response) {
	var altoFile = jpgToAXml(request.params.imageId)
	pg.query("SELECT * FROM work WHERE refid = $1",[request.params.refid],(error,dbResults)=>{
		if (dbResults[0]){
			// retrive the listing of that dir
			
			s3.processAlto(`https://s3.amazonaws.com/${bucket}/${request.params.refid}/${altoFile}`, (pageData)=>{
				response.render('pages/mark', {db:dbResults[0], image: `https://s3.amazonaws.com/${bucket}/${request.params.refid}/${request.params.imageId}`,  refid: request.params.refid, pageData:pageData, bucket:bucket})
			})
		}else{
			response.send('No Work!')
		}
	})
})


app.get('/work/:refid', function(request, response) {
	pg.query("SELECT * FROM work WHERE refid = $1",[request.params.refid],(error,dbResults)=>{
		if (dbResults[0]){
			// retrive the listing of that dir
			s3.workFiles(bucket,request.params.refid,(s3Results)=>{
				response.render('pages/work', {db:dbResults[0], refid: request.params.refid, s3:s3Results, bucket:bucket});
			})
		}else{
			response.send('No Work!')
		}
	})
});

app.post('/work/submit', function(request, response) {
	

	pg.query("UPDATE work SET info = $1 WHERE refid = $2",[JSON.stringify(request.body.data),request.body.id],(error,dbResults)=>{
		if (error) console.log(error)
	})
    response.send('true')
});

app.post('/work/complete', function(request, response) {
	

	pg.query("UPDATE work SET complete = true, complete_date = NOW() WHERE refid = $1",[request.body.id],(error,dbResults)=>{
		if (error) console.log(error)
	})
    response.send('true')
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
