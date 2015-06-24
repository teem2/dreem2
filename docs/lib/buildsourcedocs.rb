#!/usr/bin/env ruby

require 'find'
require 'cgi'
require 'coderay'

scriptdir    = File.dirname(__FILE__)
basedir      = File.expand_path(File.join(scriptdir, '..', '..'))
classesdir   = File.join(basedir, 'classes')
docsdir      = File.join(basedir, 'docs', 'api', 'source')

Find.find(classesdir) do |path|
  if !FileTest.directory?(path) && File.extname(path) == '.dre'
    name = path[/^.*?([^\/\\]+)\.dre$/, 1]
    filedata = File.open(path).read

    File.open(File.join(docsdir, "#{name}.html"), "w") { |f|
      f.puts(CodeRay.scan(filedata, :xml).page)
    }
  end
end
