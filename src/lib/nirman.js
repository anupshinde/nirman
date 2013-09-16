/* 
	Nirman(js): HTML Static site generator.
*/


"use strict";
var fs = require('fs');
var path = require("path");
//var markdown = require("markdown").markdown;
var showdown = require("showdown");
var showdownConverter = new showdown.converter();
var _ = require("underscore");
var nunjucks = require('nunjucks');
var jsyaml = require('js-yaml');
var moment = require('moment');
var url = require('url');
var program = require('commander');



var basedir = process.cwd();
var connect_port = 8888;


program
  .version('0.1.1')
  .option('-n, --new', 'Create new project')
  .option('-dbg, --debug', 'Print debug statements')
  .option('-d, --dir [type]', 'Site directory: [dir]', '')
  .option('-p, --port [type]', 'Local server port: [port]', 8888)
  .parse(process.argv);

//console.log("-"+program.dir+"-"); 
if(program.dir!='')  {
	if(fs.existsSync(program.dir)) {
		//console.log("-"+program.dir+"-"); 
		basedir = program.dir;
	}
}
connect_port = program.port;



var srcdir = path.join(basedir, "contents");
var outdir = path.join(basedir, "build");
var layoutdir = path.join(basedir, "layouts");
var _watch_dirlist = {};
var __elements__ = "Elements"
var __directories__ = "Directories"

var nunjucks_env = new nunjucks.Environment(new nunjucks.FileSystemLoader(layoutdir));


var lastUpdateTime = new Date().getTime();
var supportedConversionFiles = [".html", ".htm", ".txt", ".json", ".md", ".xml", ".generator"];

console.log("Working on directory: ", basedir);

var ConsoleColor = {
	red   : '\u001b[31m',
	blue  : '\u001b[34m',
	reset : '\u001b[0m'
}

var siteConfig,layoutmap, filemap, contentmap;
var connect = require('connect')
var app = null;


  
function showError(message) {
	console.error(ConsoleColor.red , message, ConsoleColor.reset);
}

function createFileMap(dir) {
	var map = {isDirectory:true};
	_watch_dirlist[dir]={};
	var files = fs.readdirSync(dir);	
	for(var i=0;i<files.length;i++) {
		var file = files[i];
		
		var p = path.join(dir,file);
		var stats = fs.statSync(p);
		if(stats.isDirectory()) {
			map[file] = createFileMap(p);
		} else {
			var ext = path.extname(file).toLowerCase();
			var base = path.basename(file,ext).toLowerCase();
			var dirpath = path.dirname(p);
			var fileObj = {
							path: p,
							dirpath: dirpath,
							filename: file,
							ext: ext,
							base: base,
							urlInfo : {
								path: p.replace(srcdir,''),
								dirPath: dirpath.replace(srcdir,''),
								dirName: path.basename(dirpath).toLowerCase()
							}							
						};
			map[file] = fileObj;
			
			setFileContent(dir,fileObj);
			//createOPFile(dir,fileObj);
		}
	}
	return map;
}

function getCodeSection(content, file_path) {
	var s = '', code='', cont = content;
	
	var idx=-1, idx2=-1;
	
	s = content.trim();
	idx = s.indexOf("-->>code>>--");
	if(idx==0) { 
	// We first check if this is the matter is at the top. 
	// if not, we donot want to consider it as front matter
		s = content;
		idx = s.indexOf("-->>code>>--");
		if(idx>=0) {
			s = s.substring(idx+12);
			idx2 = s.indexOf("-->>code>>--");	
			if(idx2>=0) {
				//matter = "---\n"+s.substring(0,idx2)+"---\n";
				code =s.substring(0,idx2);
				cont = content.substring(idx2+idx+24).replace("\n","");
			}
		}
	}


	//if(code.trim()!="") console.log("Code is ", code, " And content is ", cont);
	return { code: code, content: cont};
	
}

function getFrontMatterAndData(content, file_path, file_base) {
	var matter = '',s = '', cont = content;
	
	var idx=-1, idx2=-1;
	
	s = content.trim();
	idx = s.indexOf("---");
	if(idx==0) { 
	// We first check if this is the matter is at the top. 
	// if not, we donot want to consider it as front matter
		s = content;
		idx = s.indexOf("---");
		if(idx>=0) {
			s = s.substring(idx+3);
			idx2 = s.indexOf("---");	
			if(idx2>=0) {
				//matter = "---\n"+s.substring(0,idx2)+"---\n";
				matter =s.substring(0,idx2);
				cont = content.substring(idx2+idx+6).replace("\n","");
			}
		}
	}
	//console.log("Idx 1 is ", idx);
	//console.log("Idx 2is ", idx2);
	//console.log("Matter is ", matter);
	//console.log("Cont is ", cont);
	//console.log("End of file path ", file_path);
	var meta = null;
	var detail = cont;

	try {
		var yaml_out = jsyaml.load(matter);
		//console.log("YAML loaded : ", yaml_out, "-"+matter+"-");
		//var yaml_out = yamlFront.loadFront(matter); // Prefixed \n since front matters without first line break give an error for some reason.
		//yaml_out = { layout: 'post', title: 'Just another post' }
		//console.log(yaml_out, content.length, file_path);
		if(!_.isUndefined(yaml_out) && !_.isEmpty(yaml_out)) {
			//detail = yaml_out.__content;
			meta = JSON.parse(JSON.stringify(yaml_out));
			delete meta.__content;
		}
	} catch(e) {
		showError("Error while processing: " + file_path, "\nMessage:\n" + e.message);
		console.log(e);
		//throw e;
	}
	if(meta) {
		meta.slug = file_base;
	}

	//console.log("Meta is ", meta, " And matter is ", matter);
	return { meta: meta, content: detail};
	
}


function setFileContent(inDir,fo) {
	fo.metadata=null;
	//console.log("Set file content called");
	if(supportedConversionFiles.indexOf(fo.ext)>=0) {
		
		var content = fs.readFileSync(fo.path,'utf8');
		var data = getFrontMatterAndData(content,fo.path, fo.base);		
		fo.metadata = data.meta;
		if(fo.metadata) {
			data = getCodeSection(data.content, fo.path);
			content = data.content;
			//console.log(fo);
			fo.metadata.code = data.code;
		} else {
			//console.log(content);
			
			/* We can skip conversion if metadata is not available 
			- Currently its an assumption that a file without metadata does not require conversion - however if the condition complicates, we need to add it here
			*/
			
			fo.ConversionNotRequired = true;
			fo.CopyOnly = true;
		}
		
		var htmlContent='';
		if(fo.ext==".md") {
			//htmlContent = markdown.toHTML(content);
			htmlContent = showdownConverter.makeHtml(content);
			htmlContent = htmlContent.split("<pre><code>").join("<pre class='prettyprint'><code>");
			fo.NewExtension = ".html";
		} else if(fo.ext==".generator") {
			fo.ExecuteOnly = true;
			htmlContent = content;
		} else {
			htmlContent = content;
		}

		//console.log('HTML content is ', htmlContent);
		
		fo.htmlContent = htmlContent;		
	} else {
		fo.ConversionNotRequired = true;
		fo.CopyOnly = true;
	}
}

function createContentMap(map) {
	var posts = {};	
	posts[__elements__] = [];
	posts[__directories__] = [];
	posts.isDirectory = true;
	for(var o in map) {
		var obj = map[o];
		
		if(obj!=null 
			&& typeof obj != 'undefined'
			&& o!="isDirectory") {
			var element = null;
			if(obj.isDirectory) {
				element = createContentMap(obj);
				posts[o]= element;
				posts[__directories__].push(element);//breaking-change?
				
				//console.log(element);
				//throw(1);
			} else {
			
				element = {
					content : obj.htmlContent,
					_filemeta : obj
				};
				var meta = obj.metadata;
				if(meta!=null) {
					for(var attr in meta) {
						if(attr.indexOf("_")!=0) {
							element[attr] = meta[attr];
						}
					}
				}
				if(typeof(obj.base) =='undefined') {
					console.log(o);
				}
				//console.log(obj.base);
				////posts[obj.base] = element;
				posts[element.slug]=(element);
				posts[__elements__].push(element);
			}
		}
	}
	return posts;
}

function copyFile(from, to) {
	return fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

function getContent(scope) {
	var layout = null;
	var content = '--missing--';
	var layout_obj = layoutmap[scope.layout];
	if(!_.isUndefined(layout_obj) && layout_obj!=null) {
		layout = layout_obj.file;
	} else {
		layout_obj = layoutmap[scope.Site.defaultLayout];
		if(!_.isUndefined(layout_obj) && layout_obj!=null) {
			layout = layout_obj.file;
		}
	}
	//console.log("Layout is ", layout, scope._filemeta.filename, scope._filemeta.dirpath);
	// Render the content based on template
	if(!_.isUndefined(layout) && layout!=null) {
		var tmpl = nunjucks_env.getTemplate(layout);
		content = tmpl.render(scope);
	} else {
		content = scope.content;
	}
	
	if(scope.ApplyTemplateToContent) {
		// Now apply content as template again to bind the variables used in content
		var tmpl = new nunjucks.Template(content);
		content = tmpl.render(scope);
		
		
		// Just an additional feature - usually you will not want to turn this on.
		// For example in you Posts-Index.html - you could point it to a template to render it - while keeping an empty file
		//   -- OR you could set the above to "true" - making it the file containing the template. However this may cause problems in Theming
		// We do this optionally - since it can very much result into errors or unexpected outputs
	}
	
	
	return content;
}

function _DeepClone(element){
	return JSON.parse(JSON.stringify(element));
}

function addLibsToScope(scope) {
	scope._ = _;
	scope.moment = moment;
}

function createScope(element, contentmap){
	var scope = JSON.parse(JSON.stringify(element));
	scope.Meta = JSON.parse(JSON.stringify(contentmap));
	scope.Site = JSON.parse(JSON.stringify(siteConfig));
	addLibsToScope(scope);

	if(scope._filemeta.metadata) {
		scope.Code = scope._filemeta.metadata.code;
	}
	
	scope.paginate = function(dataSet, options){	
		
		var data = dataSet;

		var default_paging_options = { 
				pageSize: 5, 
				firstPageName: scope.slug, 
				pageNamePrefix: "page",
				pageNameTemplate: "" // Either prefix or template is used - not both. PageScope is passed to template
		};
		if(_.isUndefined(options) || options==null) {
			//console.log(options);
			options  = default_paging_options;
		}
		
		var extension = scope._filemeta.ext;
		var outPath = scope._filemeta.dirpath.replace(srcdir,outdir);
		
		var pageSize = options.pageSize;
		if(_.isUndefined(pageSize) || pageSize==null) pageSize = default_paging_options.pageSize;
		
		var pageNamePrefix = options.pageNamePrefix;
		if(_.isUndefined(pageNamePrefix) || pageNamePrefix==null) pageNamePrefix = default_paging_options.pageNamePrefix;
		
		var pageNameTemplate = options.pageNameTemplate;
		if(_.isUndefined(pageNameTemplate) || pageNameTemplate==null) pageNameTemplate = default_paging_options.pageNameTemplate;
		
		var firstPageName = options.firstPageName;
		if(_.isUndefined(firstPageName ) || firstPageName ==null) firstPageName  = default_paging_options.firstPageName;
		
		//console.log(pageSize, pageNamePrefix, firstPageName, scope.content);

		var lists = _.groupBy(data, function(a, b){
		  return Math.floor(b/pageSize);
		});
		lists = _.toArray(lists);
		
		//console.log("Generating pages", scope._filemeta.filename);
		// now just iterate thru the list of scopes and apply templates - We do not execute the code section again - it has been called once.
		var pages = [];
		for(var i=0;i<lists.length;i++) {
			pages.push({
				Elements : lists[i]
			});
		}

		for(var i=0;i<pages.length;i++) {
			var page = pages[i];
			page.NextPage = pages[i+1];
			page.PrevPage = pages[i-1];
			page.PageNumber=i+1;
			page.TotalPages= pages.length;
			page.HasNext= (pages.length > i+1);
			page.HasPrev= (i>0);
			
			var slugPrefix = scope.slug+"-";			
			/* 
				For index pages, we donot want a naming format like index-page2.html, instead page2.html will be good.
				However for other pages like "recipes.html", we can use recipes-page2.html
				We cannot use simply "page2" for everything, since it can create name conflicts.
			
			*/
			
			var isIndex = (scope.slug.toLowerCase().trim()=="index");

			if(isIndex) slugPrefix="";
			
			var currPageName = slugPrefix+pageNamePrefix + (i+1);
			var currPageRelURL = currPageName;
			
			if(pageNameTemplate!="") {	
				var tmplName = new nunjucks.Template(pageNameTemplate);
				currPageName = tmplName.render(page);
				//console.log("Templated name is ", currPageName, pageNameTemplate);
			}
			
			if(i==0) {
				currPageName = scope.slug;
				if(isIndex) currPageRelURL = "../";
			}
			
			page.Name= currPageName;
			page.RelURL= currPageRelURL;
		}
		
		for(var i=1;i<pages.length;i++) {			
			var newScope = _DeepClone(scope);
			addLibsToScope(newScope);
			newScope.PageInfo=pages[i];

			var cont = getContent(newScope);
			
			var filepath = path.join(outPath,pages[i].Name+extension);
			fs.writeFileSync(filepath, cont);
		}
		
		scope.PageInfo = pages[0];
	}
	
	if(!_.isUndefined(scope.Code) && scope.Code !=null) {
		//console.log(element.code);
		var addToScope = new Function('scope',scope.Code);
		//console.log("Add to scope: ", addToScope);
		if(typeof(addToScope)!='undefined') {
			addToScope.call(this,scope);
		}
	}

	//console.log("Returning main scope", scope._filemeta.filename);
	return scope;
}

function createOPFile(fo, ele) {
		var outPath = fo.dirpath.replace(srcdir,outdir);
		createPath(outPath);	
		//console.log("Creating path ", outPath);
		if(fo.ExecuteOnly) {
			var scope = createScope(ele, contentmap);
			(function(scp){
				"use strict";
				var scope = scp;
				var Meta = scope.Meta;
				var Fso = fs;
				var CurrentInputDir = scope._filemeta.dirpath;
				var CurrentOutputDir = outPath;
				var CurrentFile = scope._filemeta.filename;
				var NunjucksEnv = nunjucks_env;
				var Moment = moment;
				var Site = scope.Site;
				var result = eval(scope.content);
				// WARNING: Unsafe with untrusted code
			}(scope));
			
		} else if(!fo.CopyOnly) {
			var ext = fo.NewExtension || fo.ext;
			var filepath = path.join(outPath,fo.base+ext);
			var content;
			try {
				var scope = createScope(ele, contentmap);
				content = getContent(scope);
			} catch(e) {
				// We had an error generating file.
				showError("Error while rendering " + fo.filename + " Path:"+ fo.path);
				console.log(e);
				//content = "\n\nError \n\n\ " +JSON.stringify(e);
				//throw e;
			}
			
			fs.writeFileSync(filepath, content);
		} else {
			var fileFromPath = fo.path;
			var fileToPath = fileFromPath.replace(srcdir,outdir);
			copyFile(fileFromPath,fileToPath);
			//console.log("Copying ", fileFromPath, " --- ",  fileToPath);
		}
}

function renderFiles(map) {
	
	//console.log('called reder files', map);
	for(var o in map) {
		//console.log(o);
		var obj = map[o];
		
		if(obj.isDirectory) {
			renderFiles(obj);
		} else {
			if(o===__elements__) {
				for(var i=0;i<obj.length;i++) {		
					var ele = obj[i];
					// We could have checked for isUndefined(filemeta), however that would mean incorrect entry in posts map - so we want to have an error in that case.

					createOPFile(ele._filemeta, ele); 
				}
			}
		}
	}
}

function createLayoutMap(dir) {
	var files = fs.readdirSync(dir);
	var map = {};
	for(var i=0;i<files.length;i++) {
		var file = files[i];
		var p = path.join(dir,file);
		var stats = fs.statSync(p);
		var ext = path.extname(file);
		var base = path.basename(file, ext).toLowerCase();
		if(stats.isFile() && ext===".html") {
			map[base] = {
				fileO: file,
				ext: ext,
				basename: base,
				file: file.toLowerCase()
			};
		}
	}
	
	return map;
}

function rmdir(dir) {
	var list = fs.readdirSync(dir);
	for(var i = 0; i < list.length; i++) {
		var filename = path.join(dir, list[i]);
		var stat = fs.statSync(filename);
		
		if(filename == "." || filename == "..") {
			// pass these files
		} else if(stat.isDirectory()) {
			// rmdir recursively
			rmdir(filename);
		} else {
			// rm filename
			fs.unlinkSync(filename);
		}
	}
	fs.rmdirSync(dir);
};

function createPath(dirpath) {
	//console.log("Path created ", dirpath);
    dirpath = path.resolve(dirpath);
	
    try {
        if (!fs.statSync(dirpath).isDirectory()) {
            throw new Error(dirpath + ' exists and is not a directory');
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            createPath(path.dirname(dirpath));
            fs.mkdirSync(dirpath);
        } else {
            throw err;
        }
    }
};

function deleteBuildDir() {
	try {
		return rmdir(outdir);
	} catch(e) {
		if(e.code==='ENOENT') {
			//console.log("Error occured while removing directory: ", e);
			return null;
		} else {
			throw e;
		}
	}
}

function readSiteConfig() {
	var configFileName = "config.yaml";
	var p = path.join(basedir,configFileName);
	if(!fs.existsSync(p)) {
		throw({code: "config-not-found", message: "Config file not found" });
	}
	var contents = fs.readFileSync(p,'utf8');
	var config = jsyaml.load(contents);
	return config;
}
 
function doRender() {
	console.log("Started rendering...");
	siteConfig = readSiteConfig();
	if(program.debug) console.log("Got Siteconfig");
	
	layoutmap = createLayoutMap(layoutdir);
	if(program.debug) console.log("Created layout map");
	
	filemap = createFileMap(srcdir);
	if(program.debug) console.log("Created file map");
	
	//_watch_dirlist["."]={};
	_watch_dirlist[basedir]={};
	_watch_dirlist[layoutdir]={};
	contentmap = createContentMap(filemap);
	if(program.debug) console.log("Created content map");
	
	deleteBuildDir();
	if(program.debug) console.log("Completed deleting build dir");
	
	renderFiles(contentmap);
	if(program.debug) console.log("Render files complete");
	
	for(var d in _watch_dirlist) {
		var o = _watch_dirlist[d];		
		if(!o.isWatching) {
			fs.watch(d, OnContentChange);
			o.isWatching = true;
		}
	}
	console.log("Render complete!");
	console.log("Server running at: http://localhost:"+ connect_port + "");
}

function OnContentChange(event, filename) {
  var curr_time = new Date().getTime();
  if( curr_time-lastUpdateTime > 5*1000) {	
	lastUpdateTime = new Date().getTime();
	doRender();
  } else {
	return;
  }
}

function createServer() {
	if(app==null)  {
		app = connect()
		.use(connect.static(outdir))
		.use(function(req, res, next) {
			// Try URLs like /page2 - with /page2.html 
			if ('GET' != req.method && 'HEAD' != req.method) return next();
			var pathname = url.parse(req.originalUrl).pathname;
			var filepath = path.join(outdir,pathname+".html");
			if(fs.existsSync(filepath) 
				&& fs.statSync(filepath).isFile()
			) {
				
				res.writeHead(200, {"Content-Type": "text/html"});
				res.end(fs.readFileSync(filepath));
				//console.log("REDIRECTING", pathname, req);
			} else {
				next();
			}
			
		})
		.use(function(request, response, next){
			var pathname = url.parse(request.originalUrl).pathname;
			if(pathname=="/--meta") {
				//console.log('called metadata describe - Req URL: ', request.url, request);
				response.writeHead(200, {"Content-Type": "application/json"});
				response.write(JSON.stringify({
					p: contentmap
					//f: filemap, 
					//l: layoutmap
				}));
				response.end();
			} else {
				next();
			}
			
		})
		.use(function(req, res, next){
			var filepath=path.join(outdir,"404.html");
			if(fs.existsSync(filepath) 
				&& fs.statSync(filepath).isFile()
			) {
				
				res.writeHead(404, {"Content-Type": "text/html"});
				res.end(fs.readFileSync(filepath));
				//console.log("REDIRECTING", pathname, req);
			} else {
				next();
			}		
		}).listen(connect_port);
	}
}


function copyDirectoryRecursive(copyInPath, copyOutPath, cb) {
	var callbacks = [];
	function copyDir(dir) {
		var files = fs.readdirSync(dir);	
		for(var i=0;i<files.length;i++) {
			var file = files[i];
			var p = path.join(dir,file);
			var stats = fs.statSync(p);
			var outPath = p.replace(copyInPath,copyOutPath);
			if(stats.isDirectory()) {
				//console.log("Creating path ", outPath);
				createPath(outPath);
				copyDir(p);
			} else {
				var fn = function() {
					//console.log("Called fn", callbacks.length);
					callbacks.pop();
					if(callbacks.length==0) {					
						//console.log('Completely copied now');
						if(cb) {
							cb();
						}
					}
				};
				callbacks.push(0);
				var r = copyFile(p,outPath);
				//console.log(r);
				r.on('finish', fn);
				//console.log("Copying file ",p,  outPath);
			}
		}
	}
	
	copyDir(copyInPath);
}

function createNewProject(callback) {
	if(fs.readdirSync(basedir).length!=0) {
		console.log("Cannot create new project. Directory not empty");
		process.exit(1);
	} else {
		var example = path.join(path.dirname(fs.realpathSync(__filename)), '../lib/examples/blog');
		copyDirectoryRecursive(example, basedir, callback);
	}
}

function startupStuff() {
	createServer();
	try {
		doRender();
	} catch(e) {
		if(e.code) {
			if(e.code=="config-not-found") {
				showError("Config not found");
				console.log("You can create a new project with --new option");				
				process.exit(0);
			}
		}
		
		else {
			throw(e);
		}
	}
}

function render() {
	if (program.new) {
		createNewProject(function() {
			// Call back called when all the files have been copied successfully.
			startupStuff();
		});
	} else {
		startupStuff();
	}
	
} 

exports.render = render;
