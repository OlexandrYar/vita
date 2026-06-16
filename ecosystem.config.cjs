/** @type {import('pm2').StartOptions} */
module.exports = {
	apps: [
		{
			name: 'vita-gerbarium',
			script: './build/index.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '256M',
			env_file: '.env'
		}
	]
};
