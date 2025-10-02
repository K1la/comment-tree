package config

type Config struct {
	Postgres   Postgres   `mapstructure:"postgres"`
	HTTPServer HTTPServer `mapstructure:"http_server"`
	Redis      Redis      `mapstructure:"redis"`
}

type Postgres struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Name     string `mapstructure:"name"`
	Password string `mapstructure:"password"`
}

type HTTPServer struct {
	Address     string `mapstructure:"address"`
	Timeout     int    `mapstructure:"timeout"`
	IdleTimeout int    `mapstructure:"idle_timeout"`
}

type Redis struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	Password string `mapstructure:"password"`
}
