#Nirman 
## - Flexible Static Site Generator for Node JS
---

Install Nirman

    npm install -g nirman

Create a directory for your site. 
    
	mkdir mysite

Create a new sample site, with the ``` --new  ``` option

    nirman --new

It will create a sample blog, generate static HTML and host it at http://localhost:8888

Press ``` Ctrl+C ``` to stop server


To generate and host a local server again, start ``` nirman ``` without the --new option.

    path\to\dir\mysite\> nirman
    
For more options on CLI:
    
    nirman --help

Make changes to your contents, and those are reflected almost immediately without having to restart Nirman.

Structure:

```

-<yourdirectory>
---- contents : All your website stuff goes in here. Arrange it the way you want it to be.
---- layouts  : Templates for rendering pages.
---- config.yaml: Site configuration variables (Title/defaultLayout/About/etc)

```

##Documentation:
*Detailed Documentation is not available yet*

You can refer to the examples below for implementation details

[Sample blog created with --new option](https://github.com/anupshinde/nirman/tree/master/src/lib/examples/blog)

[My personal blog - created using Nirman](https://github.com/anupshinde/anupzsite)


