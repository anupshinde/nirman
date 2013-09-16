---
layout: post
IsWikipediaStuff: true
title: Markdown
date: 2006-12-01
tags: markdown, syntax, sample content
---
Markdown is a lightweight markup language, originally created by John Gruber with substantial contributions from Aaron Swartz,[4] allowing people “to write using an easy-to-read, easy-to-write plain text format, then convert it to structurally valid XHTML (or HTML)”.[2] The language takes many cues from existing conventions for marking up plain text in email. Markdown formatted text should be readable as-is, without looking like it's been marked up with tags or formatting instructions,[5] unlike text which has been formatted with a Markup language, such as HTML, which has obvious tags and formatting instructions. Markdown is a formatting syntax for text that can be read by humans and can be easily converted to HTML.


Markdown is also a Perl script written by Gruber, Markdown.pl, which converts marked-up text input to valid, well-formed XHTML or HTML and replaces left-pointing angle brackets ('<') and ampersands with their corresponding character entity references. It can be used as a standalone script, as a plugin for Blosxom or Movable Type, or as a text filter for BBEdit.[2]
Markdown has since been re-implemented by others as a Perl module available on CPAN (Text::Markdown), and in a variety of other programming languages. It is distributed under a BSD-style license[3] and is included with, or available as a plugin for, several content-management systems.[6][7]
Sites such as GitHub, reddit, Diaspora, Stack Overflow, OpenStreetMap, and SourceForge use Markdown to facilitate discussion between users.[8][9][10][11]


==Syntax examples==

This is not an exhaustive listing of Markdown's syntax, and in many cases multiple styles of syntax are available to accomplish a particular effect. See the [http://daringfireball.net/projects/markdown/syntax full Markdown syntax] for more information. Characters which are ordinarily interpreted by Markdown as formatting commands will instead be interpreted literally if preceded by a backslash; for example, the sequence '\*' would output an asterisk rather than beginning a span of emphasized text. Markdown also does not transform any text within a "raw" block-level XHTML element; thus it is possible to include sections of XHTML within a Markdown source document by wrapping them in block-level XHTML tags.

===Headings===

HTML headings are produced by placing a number of [[Number sign|hashes]] before the header text corresponding to the level of heading desired (HTML offers six levels of headings), like so:
```
 # First-level heading
 
 #### Fourth-level heading
```