#!/usr/bin/env ruby

# Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
# You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific language governing permissions and limitations under the License.

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

