{
    'name': 'Modern Kanban View Theme',
    'version': '19.0.1.0.0',
    'summary': 'Tema moderno global para todas las vistas Kanban en Odoo 19',
    'category': 'Technical',
    'author': 'Alphaqueb Consulting SAS',
    'depends': ['web'],
    'assets': {
        'web.assets_backend': [
            'theme_kanban_modern/static/src/css/kanban_modern.scss',
            'theme_kanban_modern/static/src/js/kanban_renderer_patch.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
