#Nirman 
## Flexible Static Site Generator for Node JS
---

## Usage 
Install Nirman

    npm install -g nirman

Create a directory for your site. 
    
	mkdir mysite


To create a new <a href="http://nirmandemo.anupshinde.com/" target="_blank">sample site as shown here</a>

    nirman --new

It will create a sample blog, generate static HTML and host it at <a href="http://localhost:8888" target="_blank" >http://localhost:8888</a>

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

## Features


1. Flexibility to arrange your site contents - the way you want it. All the stuff goes in "contents" directory.

2. Templating is similar to Jinja templates. Here we use Nunjucks templating

   Additionaly, you can use your content files as your template - This helps avoid cases where you create a one line file just to point to another template file. This feature is optional.
   
3. Content metadata is available to your templates directly.
   
   Example: If your directory is named "posts", you can access the contents with Meta.posts.Elements

4. Markdown support via Showdown 

5. Generators - Special script files written in JavaScript that are passed the Scope and content Metadata. 
    
    You can simply add code here to create your own output.

    Example: You want to create a page listing all the Categories in your content.

6. Front Matter - Configuration for a post/document can be placed as a front-matter at the top of the content file. You can add date, title, or anything that is supported as YAML. All this configuration is available to the Scope of the template

7. Code blocks within content ( &lt;script type="application/x-nirman-code" ).

   Sometimes, you want a modified version of your data. For example: Metadata provides you the list of posts. However, in your content, you may require the post to be sorted/filtered by date/title/category/ (whatever) ... Best is to leave this to you. 
   
   With this feature you can add JavaScript-functions to you current template scope. And then use these methods in your template - Helps keeps code clean with code and HTML separation.
   
8. Paging support.

    Simply create a code block within your content, get the items, and mention "scope.paginate(options)". Then in your content use the paged-data to render content. You require ApplyTemplateToContent = TRUE to use this feature.
	




## Documentation:
*Detailed Documentation is not available yet*

You can refer to the examples below for implementation details

[Sample blog created with --new option](https://github.com/anupshinde/nirman/tree/master/src/lib/examples/blog)

[My personal blog - created using Nirman](https://github.com/anupshinde/anupzsite)


