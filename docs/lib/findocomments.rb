#!/usr/bin/env ruby

require 'find'
require 'fileutils'

scriptdir    = File.dirname(__FILE__)
basedir      = File.expand_path(File.join(scriptdir, '..', '..'))
classesdir   = File.join(basedir, 'classes')
classdocsdir = File.join(basedir, 'docs', 'classdocs')

FileUtils.mkdir_p(classdocsdir)

comments = {}

Find.find(classesdir) do |path|
  if !FileTest.directory?(path) && File.extname(path) == '.dre'
    name = path[/^.*?([^\/\\]+)\.dre$/, 1]
    if m = File.open(path).read.scan(/(\/\*\*.*?\*\/)/m)
      comments[name] = m.to_a
    end
  end
end

comments.each do |file, content|
  File.open(File.join(classdocsdir, "#{file}.js"), "w") do |f|
    f.puts(content.join("\n"))
  end
end

