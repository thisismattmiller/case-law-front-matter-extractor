const fs = require('fs')
const glob = require('glob')
const H = require('highland')
const userArgs = process.argv.slice(2)
const sharp = require('sharp')


if (!userArgs[0]){

  console.log('Pass the full path to the directory of tiffs to convert to jpegs!')
  process.exit()
}

if (!userArgs[0].endsWith('/')) userArgs[0] = userArgs[0] +'/'

glob(userArgs[0] + '/**', {}, function (er, files) {

  var convert = function(inputFileName, cb){
  
    var outputFileName = inputFileName.replace(/\.tif$/i,'.jpg')

    if (fs.existsSync(outputFileName)){
      cb(null,outputFileName)
      return false
    }

    sharp(inputFileName)
      .jpeg()
      .toFile(outputFileName, function(err, info) {
        cb(null,outputFileName)
      })
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
    .map(H.curry(convert))
    .nfcall([])
    .parallel(4)
    .done(()=>{})




})
