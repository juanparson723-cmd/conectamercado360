CREATE DATABASE mer360;

Use mer360;

CREATE TABLE roles(
    id_r INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE
);

CREATE TABLE Usuarios(
    id_u INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    correo VARCHAR(100) UNIQUE,
    password VARCHAR (200),
    telefono VARCHAR (20),
    foto VARCHAR (500),
    fecha_registro DATATIME  DEFAULT TRUE,
    id_r INT,

    FOREING KEY (id_r)
    REFERENCES roles(id_r)
);

CREATE TABLE locales(
    id_l INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR (100),
    descripcion TEXT,
    video_ubicacion VARCHAR (500),
    imagen_fachada VARCHAR (500),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE horarios_local(
    id_h INT AUTO_INCREMENT PRIMARY KEY,
    id_l INT,
    dia_semana VARCHAR(20),
    apertura TIME,
    cierre TIME,

    FOREIGN KEY(id_local)
    REFERENCES locales(id_local)
);

CREATE TABLE categorias(
    id_c INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100)
);

CREATE TABLE productos (
    id_p INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR (100),
    descripcion TEXT,
    precio INT,
    Stock INT,
    imagenes VARCHAR (500)
    id_l INT,
    id_c INT, 

    FOREING KEY (id_l)
    REFERENCES locales(id_l),

    FOREING KEY (id_c)
    REFERENCES categorias(id_c)

);

CREATE TABLE reseñas (
    id_re INT AUTO_INCREMENT PRIMARY KEY,
    id_u INT,
    id_l INT,
    comentario TEXT,
    fecha DATATIME DEFAULT CURRENT_TIMESTAP,

    FOREING KEY(id_l)
    REFERENCES locales(id_l),

    FOREING KEY(id_u)
    REFERENCES Usuarios(id_u)
);

CREATE TABLE Calificaciones(
    id_ca INT AUTO_INCREMENT PRIMARY KEY,
    id_u INT,
    id_l INT,
    puntuacion INT CHECK (
        puntuacion BETWEEN 1 AND S
    ),
    fecha DATA TIME  CURRENT_TIMESTAP,

    PRIMARY KEY (id_u)
    REFERENCES Usuarios(id_u)

    FOREING KEY (id_l)
    REFERENCES locales(id_l)
);

CREATE TABLE favoritos(
    id_f INT AUTO_INCREMENT PRIMARY KEY,
    id_u INT,
    id_p INT,

    PRIMARY KEY (id_u)
    REFERENCES Usuarios(id_u)

    FOREING KEY (id_p)
    REFERENCES productos(id_p)
);

CREATE TABLE promociones(
    id_promocion INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    descripcion TEXT,
    descuento INT,
    fecha_inicio DATE,
    fecha_fin DATE,
    id_local INT,

    FOREIGN KEY(id_local)
    REFERENCES locales(id_local)
);

CREATE TABLE visitas_locales(
    id_visita INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_local INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_usuario)
    REFERENCES usuarios(id_usuario),

    FOREIGN KEY(id_local)
    REFERENCES locales(id_local)
);

CREATE TABLE administradores_local(
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_local INT,

    FOREIGN KEY(id_usuario)
    REFERENCES usuarios(id_usuario),

    FOREIGN KEY(id_local)
    REFERENCES locales(id_local)
);

CREATE TABLE reportes(
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_reporta INT,
    id_resena INT,
    motivo TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);




#####from flask import Flask
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for
from flask import session
from flask import flash

from config import Config
from database import get_connection

import bcrypt

app = Flask(__name__)
app.config.from_object(Config)


@app.route("/", methods=["GET", "POST"])
def index():

    if request.method == "POST":

        nombre = request.form.get("nombre")
        apellidos = request.form.get("apellidos")
        correo = request.form.get("correo")
        telefono = request.form.get("telefono")
        password = request.form.get("password")
        codigo = request.form.get("codigo")

        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM usuarios
            WHERE correo = %s
            """,
            (correo,)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:

            flash("El correo ya está registrado")

            cursor.close()
            conexion.close()

            return redirect(url_for("index"))

        id_r = 1

        if codigo:

            cursor.execute(
                """
                SELECT *
                FROM codigos_local
                WHERE codigo = %s
                """,
                (codigo,)
            )

            codigo_valido = cursor.fetchone()

            if codigo_valido:
                id_r = 2

        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO usuarios
            (
                nombre,
                apellidos,
                correo,
                password,
                telefono,
                id_r
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s
            )
            """,
            (
                nombre,
                correo,
                apellidos,
                password_hash,
                telefono,
                id_r
            )
        )

        conexion.commit()

        cursor.close()
        conexion.close()

        flash("Cuenta creada correctamente")

        return redirect(url_for("inicio"))

    return render_template("index.html")


@app.route("/iniciar_sesion", methods=["POST"])
def iniciar_sesion():

    correo = request.form.get("correo")
    password = request.form.get("password")

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM usuarios
        WHERE correo = %s
        """,
        (correo,)
    )

    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    if not usuario:

        flash("Correo incorrecto")

        return redirect(url_for("index"))

    if not bcrypt.checkpw(
        password.encode("utf-8"),
        usuario["password"].encode("utf-8")
    ):

        flash("Contraseña incorrecta")

        return redirect(url_for("index"))

    session["id_u"] = usuario["id_u"]
    session["nombre"] = usuario["nombre"]
    session["id_r"] = usuario["id_r"]

    return redirect(url_for("inicio"))

@app.route("/inicio")
def inicio():

    if "id_u" not in session:
        return redirect(url_for("index"))

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM productos
        LIMIT 12
    """)

    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return render_template(
        "inicio.html",
        productos=productos
    )

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("index"))


@app.route("/resultados")
def resultados():

    busqueda = request.args.get("q", "")

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    sql = """
    SELECT
        p.id_p,
        p.nombre AS producto,
        p.precio,
        p.imagenes,
        l.id_l,
        l.nombre AS local
    FROM productos p
    INNER JOIN locales l
    ON p.id_l = l.id_l
    WHERE
        p.nombre LIKE %s
        OR l.nombre LIKE %s
    """

    cursor.execute(
        sql,
        (
            f"%{busqueda}%",
            f"%{busqueda}%"
        )
    )

    resultados = cursor.fetchall()

    cursor.close()
    conexion.close()

    return render_template(
        "resultados.html",
        resultados=resultados,
        busqueda=busqueda
    )


@app.route("/local/<int:id_l>")
def local(id_l):

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM locales
        WHERE id_l = %s
        """,
        (id_l,)
    )

    local = cursor.fetchone()

    cursor.execute(
        """
        SELECT *
        FROM productos
        WHERE id_l = %s
        """,
        (id_l,)
    )

    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return render_template(
        "local.html",
        local=local,
        productos=productos
    )


if __name__ == "__main__":
    app.run(debug=True)