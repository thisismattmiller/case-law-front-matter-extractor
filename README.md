# Front Matter Extractor

A Node app, ready to be deployed on Heroku. You need to add your assets to s3, and should be publicly available via http. The root items should be directories named with an identifier and should contain the JPG and XML ALTO file for example:

```
1234567890
 --page_1_0.jpg
 --page_1_1.jpg
 --page_2_0.jpg
 --page_2_1.jpg
 --page_1_0.xml
 --page_1_1.xml
 --page_2_0.xml
 --page_2_1.xml
```

You need to add 2 new env variables to allow access to read the s3 bucket, in Heroku you would do:
```
heroku config:set AWS_SECRET_ACCESS_KEY=xxxxxxxxx AWS_ACCESS_KEY_ID=yyyyyyyyy
```

Also edit these [3 config lines in index.js](https://github.com/thisismattmiller/case-law-front-matter-extractor/blob/master/index.js#L10)

 
 
