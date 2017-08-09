const fs = require('fs')
const glob = require('glob')
const H = require('highland')
const userArgs = process.argv.slice(2)


if (!userArgs[0]){

  console.log('Pass the full path to the directory of tiffs to be deleted!')
  process.exit()
}

if (!userArgs[0].endsWith('/')) userArgs[0] = userArgs[0] +'/'

glob(userArgs[0] + '/**', {}, function (er, files) {

  var deleteIt = function(inputFileName, cb){
    fs.unlinkSync(inputFileName)
    cb(null,inputFileName)
  }



  
  H(files)
    .map((f) =>{
      if (f.endsWith('.tif')){

        console.log(f)
        return f


      }else{
        return ''
      }


    })
    .compact()
    .map(H.curry(deleteIt))
    .nfcall([])
    .parallel(4)
    .done(()=>{})




})



// gm('workingForAnOppressiveGovernmentAndOtherEssays_0008.jp2')
// .identify(function (err, data) {
// console.log(err)
//   if (!err) console.log(data)
// })
// .autoOrient()
// .write('oriented.jpg', function (err) {
//   if (err) console.log(err)
// });
