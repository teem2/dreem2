#!/usr/bin/env ruby

# Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
# You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific language governing permissions and limitations under the License.

require 'json'

LIB_DIR  = File.expand_path(File.dirname(__FILE__))
DOCS_DIR = LIB_DIR[/(.*?)\/lib/, 1]
ROOT_DIR = File.join(DOCS_DIR, '..')

module Dreem
  class GuideBuilder

    def self.build(guides_dir)
      items = Dir["#{guides_dir}/**/README.md"].map do |readme|
        file = File.open(readme).read
        name = readme[%r{/([^/]+)/README.md$}, 1]
        title = file[/# (.*)$/, 1]
        description = file[%r{\[//\]: # (.*)$}, 1]

        {
            name: name,
            url: "guides/#{name}",
            title: title,
            description: description
        }

      end

      { title: "Dreem Guides", items: items }
    end

  end

  class CategoriesBuilder
    def self.build(root_dir)
      search_files = [*Dir[File.join(root_dir, 'lib', 'dr', '*.js')],
                      *Dir[File.join(root_dir, 'lib', 'dr', '**', '*.js')],
                      *Dir[File.join(root_dir, 'core', '*.js')],
                      *Dir[File.join(root_dir, 'classes', '*.dre')]]

      groups = {}

      search_files.each do |file|
        open(file) do |f|
          f.each_line do |line|
            if m = /@class\s+(?<name>[^\{]*)\s*\{(?<cats>[^\}]*)\}/.match(line)

              name = m[:name].strip
              cats = m[:cats].split(',').map(&:strip)
              cats.each do |cat|
                groups[cat] ||= []
                groups[cat] << name
              end

            end
          end
        end
      end

      all_group = {
        name: 'All Classes',
        classes: %w(Eventable dr dr.*)
      }

      { name: 'Dreem Classes',
        groups: [ all_group, *( groups.map { |n, c| { name:n, classes:c.sort.uniq } }) ]
      }
    end
  end
end

guides = Dreem::GuideBuilder.build(File.join(DOCS_DIR, 'guides'))
categories = Dreem::CategoriesBuilder.build(ROOT_DIR)

File.open(File.join(DOCS_DIR, 'guides.json'), 'w')     { |f| f.write [guides].to_json     }
File.open(File.join(DOCS_DIR, 'categories.json'), 'w') { |f| f.write [categories].to_json }
