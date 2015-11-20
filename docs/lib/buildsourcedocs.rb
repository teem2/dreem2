#!/usr/bin/env ruby

# Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
# You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific language governing permissions and limitations under the License.

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
