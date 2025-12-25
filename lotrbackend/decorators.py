from flasgger import swag_from
from jinja2 import Template
import yaml
import os
import logging

def swag_template(file_path, **data):
    """
    Custom decorator to render a YAML file with Jinja2 before passing it to Flasgger.
    
    Usage:
        @swag_template('docs/generic_get.yml', name='Units')
        def get_units(): ...
    """
    def decorator(function):
        try:
            # 1. Resolve the absolute path (adjust 'docs' folder location as needed)
            # Assuming files are in a 'docs' folder relative to the app root
            base_dir = os.getcwd() 
            full_path = os.path.join(base_dir, file_path)
            
            # 2. Read the raw YAML/Jinja file
            with open(full_path, 'r') as f:
                template_content = f.read()
            
            # 3. Render the Jinja template manually
            # This replaces {{ name }} with the actual value (e.g., "Units")
            template = Template(template_content)
            rendered_yaml = template.render(**data)
            
            # 4. Parse the rendered YAML into a Python Dictionary
            spec_dict = yaml.safe_load(rendered_yaml)
            
            # 5. Pass the clean Dict to the original swag_from decorator
            # Flasgger handles dicts perfectly, so no parsing errors occur!
            return swag_from(spec_dict)(function)
            
        except Exception as e:
            logging.error(f"Failed to load Swagger template {file_path}: {e}")
            # Return the original function unmodified if it fails, or raise error
            return function
            
    return decorator