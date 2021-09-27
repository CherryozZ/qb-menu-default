fx_version 'cerulean'

version '1.0.4'


client_scripts {
	'@qb-core/client/wrapper.lua',
	'client/main.lua'
}

ui_page {
	'html/ui.html'
}

shared_script {
	'@qb-core/import.lua'
}


files {
	'html/*.html',
	'html/css/*.css',
	'html/js/*.js',
	'html/fonts/*.ttf'
}



