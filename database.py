#la conexion de la base de datos con 
import mysql.connector #mysql conector sirve para establecer la coneccion
from config import Config #importa config para obtener sus parametros


def get_connection(): #todo lo que se vio en config
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )