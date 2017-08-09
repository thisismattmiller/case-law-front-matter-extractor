const { Pool } = require('pg')
const _ = require('highland')

module.exports = {

	debug: false,
	pool: null,

	init: function(callback){
		var self = this

		this.pool = new Pool({connectionString: process.env.DATABASE_URL + '?ssl=true'})

		this.pool.on('error', (err, client) => {
		  console.error('Unexpected error on idle client', err)
		  process.exit(-1)
		})

		this.pool.on('connect', (client) => {
			// check if the tables exists, if not build them\
			self.query("SELECT * FROM work LIMIT 1",[],(error,results)=>{
				console.log(error)
				if (error){
					self.buildTables()
				}
			})		
		})

	},
	query: function(query,vars,callback){
		this.pool.connect((err, client, done) => {
		  if (err) throw err
		  client.query(query,vars, (err, res) => {
		    done()

		    if (err) {
		      console.log(err.stack)
		      if (callback) callback(err.stack,[])
		    } else {
		      if (callback) callback(null,res.rows)
		    }
		  })
		})		
	},

	dump: function(callback){

		this.query("SELECT * FROM work WHERE complete = true;",[],(err,r)=>{

			callback(r)

		})


	},

	getStatus: function(callback){

		this.query("SELECT COUNT(ID) FROM work;",[],(err,r)=>{
			
			var total = r[0].count
			
			this.query("SELECT COUNT(ID) FROM work WHERE complete = true;",[],(err,r)=>{
				var complete = r[0].count

				var percent = Math.round((complete/total) / 10) * 10
				if (percent < 10) percent = 10

				this.query("SELECT refid FROM work where complete = true order by complete_date DESC LIMIT 100;",[],(err,r)=>{

					if (callback) callback({total:total, complete:complete,percent:percent, recent: r})	
				})

				

			})
			
			
		})


	},

	buildTables:function(callback){

		var sql = `CREATE TABLE work (
					 ID serial NOT NULL PRIMARY KEY,
					 info json NOT NULL,
					 refId varchar(256) UNIQUE,
					 complete boolean DEFAULT FALSE,
					 complete_date timestamp
					);`

		this.query(sql,[],(err,r)=>{
			
			if (callback) callback(err,r)
		})


	},
	populateWorkList:function(workList){
		var self = this

		_(workList)
		.ratelimit(1, 10)
		.map(function(w){
		  var id = w.Prefix.replace(/\//g,'')
		  self.query('INSERT INTO work(info, refId) values($1, $2) ON CONFLICT (refId) DO NOTHING',["{}",id])	
		})
		.done(()=>{
			console.log('Done populating work list data!')
		})
	}




}