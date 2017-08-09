const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const request = require('request')
const xpath = require('xpath')
const dom = require('xmldom').DOMParser

module.exports = {

	debug: false,

	list: function(bucket,cb){
		var list = []
		s3.listObjects({Bucket:bucket,Delimiter:"/"}).
		on('success', function handlePage(r) {
		    //... handle page of contents r.data.Contents
		    r.data.CommonPrefixes.forEach((i)=>{
		    	if (i.Prefix.endsWith('/')) list.push(i)
		    })


		    if(r.hasNextPage()) {
		        // There's another page; handle it
		        r.nextPage().on('success', handlePage).send();
		    } else {
		        // Finished!
		        cb(list)
		    }
		}).
		on('error', function(r) {
		    // Error!
		    console.log(r)
		    cb(false)
		}).
		send();


	},

	workFiles: function(bucket,dir,cb){
		var list = []
		s3.listObjects({Bucket:bucket,Prefix: `${dir}/`}).
		on('success', function handlePage(r) {
		    //... handle page of contents r.data.Contents
		    r.data.Contents.forEach((i)=>{
		    	if (i.Key.endsWith('.jpg')) list.push(i)
		    })


		    if(r.hasNextPage()) {
		        // There's another page; handle it
		        r.nextPage().on('success', handlePage).send();
		    } else {
		        // Finished!
		        cb(list)
		    }
		}).
		on('error', function(r) {
		    // Error!
		    console.log(r)
		    cb(false)
		}).
		send();


	},

	processAlto: function(url,callback){
		


		request(url, function (error, response, body) {
		  // console.log('error:', error); // Print the error if one occurred 
		  // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
		  // console.log('body:', body); // Print the HTML for the Google homepage. 


			 
			var doc = new dom().parseFromString(body)
			var nodes = xpath.select("//*", doc)
			var strings = []
			var pageHeight = null
			var pageWidth = null
			nodes.forEach((n)=>{

				if (n.tagName === 'Page'){
					for (let x in n.attributes){
						if (n.attributes[x].name === 'HEIGHT') pageHeight = n.attributes[x].value
						if (n.attributes[x].name === 'WIDTH') pageWidth = n.attributes[x].value
					}
				}

				if (n.tagName === 'String'){

					let node = {
						content:null,
						vpos:null,
						hpos:null,
						height:null,
						width:null
					}

					for (let x in n.attributes){
						if (n.attributes[x].name === 'CONTENT') node.content = n.attributes[x].value
						if (n.attributes[x].name === 'HEIGHT') node.height = n.attributes[x].value
						if (n.attributes[x].name === 'HPOS') node.hpos = n.attributes[x].value
						if (n.attributes[x].name === 'VPOS') node.vpos = n.attributes[x].value
						if (n.attributes[x].name === 'WIDTH') node.width = n.attributes[x].value
					}
					strings.push(node)

				}
			})

			callback({height:pageHeight, width:pageWidth, strings: strings})
			// console.log(nodes)


		});



	}




}