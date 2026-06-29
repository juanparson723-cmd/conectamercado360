from flask import Flask #importa flask
from flask import render_template # muestra los HTML
from flask import request #obtiene datos enviados desde formularios
from flask import redirect #redirigir al usuario a otra rut
from flask import url_for #genera rutas 
from flask import session #sesión del usuario
from flask import flash #permite mostrar mensajes temporales al usuario

from config import Config # importa la configuración de la db
from database import get_connection # importa la función para conectarse a la base de datos

import bcrypt # se utiliza para cifrar contraseñas

app = Flask(__name__) # crea la aplicación Flask
app.config.from_object(Config) #carga lo que tenga config


# =registro

@app.route("/", methods=["GET", "POST"])
def index():

    if request.method == "POST": #aqui se piden los datos a continuacion

        nombre = request.form.get("nombre")
        apellidos = request.form.get("apellidos")
        correo = request.form.get("correo")
        telefono = request.form.get("telefono")
        password = request.form.get("password")
        codigo = request.form.get("codigo")

        conexion = get_connection() # es la conexion con la base de datos
        cursor = conexion.cursor(dictionary=True)

        #la base de datos comprueba si el correo ya esta utilizado
        cursor.execute("""
            SELECT * FROM usuarios
            WHERE correo = %s
        """, (correo,))

        #si el correo ya esta registrado redirige a index
        usuario_existente = cursor.fetchone()

        if usuario_existente:
            flash("El correo ya está registrado")
            cursor.close()
            conexion.close()
            return redirect(url_for("index"))

        id_r = 3 #asigna el rol en este caso usuario normal
        id_l = None

        if codigo: #este codigo relaciona al dueño con su local 
            cursor.execute("""
                SELECT * FROM codigos_local
                WHERE codigo = %s
            """, (codigo,))

            #y si el codigo es valido activa su rol de administrador de su local
            codigo_valido = cursor.fetchone()

            if codigo_valido:
                id_r = 2
                id_l = codigo_valido["id_l"]

        #aqui se encripta la contraseña gracias a bcrypt
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        #aqui se insertan los datos en la base de datos 
        cursor.execute("""
            INSERT INTO usuarios
            (
                nombre,
                apellidos,
                correo,
                password,
                telefono,
                id_r,
                id_l
            )
            VALUES
            (%s,%s,%s,%s,%s,%s,%s)
        """, (
            nombre,
            apellidos,
            correo,
            password_hash,
            telefono,
            id_r,
            id_l
        ))

        #se repite mucho por que es la representacion de que se cierra la conexion de la db
        conexion.commit()

        user_id = cursor.lastrowid

        session["id_u"] = cursor.lastrowid
        session["nombre"] = nombre
        session["id_r"] = id_r
        session["id_l"] = id_l

        cursor.close()
        conexion.close()

        #si la cuenta se crea correctamente manda a inicio
        flash("Cuenta creada correctamente")
        return redirect(url_for("inicio"))

    return render_template("index.html") #se cierra la definicion de index


# inicio de sesion
@app.route("/iniciar_sesion", methods=["POST"])
def iniciar_sesion():

    #se pide correo y contraseña
    correo = request.form.get("correo")
    password = request.form.get("password")

    #se repite
    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    #selecciona de usuarios el correo y lo verifica
    cursor.execute("""
        SELECT * FROM usuarios
        WHERE correo = %s
    """, (correo,))

    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    #si el correo es incorrecto o la contraseña lo es redirige a index
    if not usuario:
        flash("Correo incorrecto")
        return redirect(url_for("index"))

    if not bcrypt.checkpw(
        password.encode("utf-8"),
        usuario["password"].encode("utf-8")
    ):
        flash("Contraseña incorrecta")
        return redirect(url_for("index"))
    
    #si todo es correcto redirige a inicio
    session["id_u"] = usuario["id_u"]
    session["nombre"] = usuario["nombre"]
    session["id_r"] = usuario["id_r"]
    session["id_l"] = usuario.get("id_l")

    return redirect(url_for("inicio"))


# el inicio XD
@app.route("/inicio")
def inicio():

    #si no hay sesion vuelve al registro

    if "id_u" not in session:
        return redirect(url_for("index"))
    
    #se repite lo de conexion
    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    #selecciona 12 productos
    cursor.execute("""
        SELECT *
        FROM productos
        LIMIT 12
    """)

    productos = cursor.fetchall()

    #se repite lo de conexion
    cursor.close()
    conexion.close()

    #muestra los productos de la busqueda
    return render_template(
        "inicio.html",
        productos=productos
    )

@app.route("/mi_local")
def mi_local():

    if "id_u" not in session:
        return redirect(url_for("index"))

    if session["id_r"] != 2:
        return redirect(url_for("inicio"))

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM locales
        WHERE id_l = %s
    """, (session.get("id_l"),))

    local = cursor.fetchone()

    cursor.execute("""
        SELECT *
        FROM productos
        WHERE id_l = %s
    """, (session.get("id_l"),))

    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return render_template(
        "admin_local.html",
        local=local,
        productos=productos
    )


@app.route("/panel_local")
def panel_local():

    
    if "id_u" not in session:
        return redirect(url_for("index"))

   
    if session["id_r"] != 2:
        return redirect(url_for("mi_local"))

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM productos
        WHERE id_l = %s
    """, (session["id_l"],))

    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return render_template(
        "admin_local.html",
        productos=productos
    )

@app.route("/agregar_producto", methods=["POST"])
def agregar_producto():

    if "id_u" not in session:
        return redirect(url_for("index"))

    if session.get("id_r") != 2:
        return redirect(url_for("inicio"))

    nombre = request.form.get("nombre")
    precio = request.form.get("precio")
    imagenes = request.form.get("imagenes")
    descripcion = request.form.get("descripcion")

    conexion = get_connection()
    cursor = conexion.cursor()

    cursor.execute("""
        INSERT INTO productos
        (nombre, precio, imagenes, descripcion, id_l)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        nombre,
        precio,
        imagenes,
        descripcion,
        session.get("id_l")
    ))

    conexion.commit()
    cursor.close()
    conexion.close()

    flash("Producto agregado correctamente")
    print("id_l en sesión:", session.get("id_l"))

    return redirect(url_for("mi_local"))

@app.route("/editar_producto/<int:id_p>", methods=["POST"])
def editar_producto(id_p):

    if "id_u" not in session:
        return redirect(url_for("index"))

    if session.get("id_r") != 2:
        return redirect(url_for("inicio"))

    nombre = request.form.get("nombre")
    precio = request.form.get("precio")
    imagenes = request.form.get("imagenes")
    descripcion = request.form.get("descripcion")

    conexion = get_connection()
    cursor = conexion.cursor()

    cursor.execute("""
        UPDATE productos
        SET
            nombre = %s,
            precio = %s,
            imagenes = %s,
            descripcion = %s
        WHERE
            id_p = %s
            AND id_l = %s
    """, (
        nombre,
        precio,
        imagenes,
        descripcion,
        id_p,
        session.get("id_l")
    ))

    conexion.commit()

    cursor.close()
    conexion.close()

    flash("Producto actualizado correctamente")

    return redirect(url_for("mi_local"))

# salida
@app.route("/logout")
def logout():

    #redirije a la plantilla principal
    session.clear()
    return redirect(url_for("index"))

@app.route("/eliminar_producto/<int:id_p>", methods=["POST"])
def eliminar_producto(id_p):

    if "id_u" not in session:
        return redirect(url_for("index"))

    if session.get("id_r") != 2:
        return redirect(url_for("inicio"))

    conexion = get_connection()
    cursor = conexion.cursor()

    cursor.execute("""
        DELETE FROM productos
        WHERE
            id_p=%s
            AND id_l=%s
    """, (
        id_p,
        session.get("id_l")
    ))

    conexion.commit()

    cursor.close()
    conexion.close()

    flash("Producto eliminado correctamente")

    return redirect(url_for("mi_local"))

# =busqueda
@app.route("/resultados")
def resultados():

    #el parametro de la busqueda en este caso q
    busqueda = request.args.get("q", "")

    #se repite la conexion
    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    #resultados que debe dar de la busqueda o de lo seleccionado
    sql = """
    SELECT
        p.id_p,
        p.nombre AS producto,
        p.precio,
        p.imagenes,
        l.id_l,
        l.nombre AS local
    FROM productos p
    INNER JOIN locales l ON p.id_l = l.id_l
    WHERE p.nombre LIKE %s
       OR l.nombre LIKE %s
    """

    #la conexion ejecuta la busqueda
    cursor.execute(sql, (
        f"%{busqueda}%",
        f"%{busqueda}%"
    ))

    #muestra los resultados 
    resultados = cursor.fetchall()

    cursor.close()
    conexion.close()

    #redirige a los resultados y la busqueda
    return render_template(
        "resultados.html",
        resultados=resultados,
        busqueda=busqueda
    )

#busqueda de locales por id
@app.route("/local/<int:id_l>")
def local(id_l):

    #se repite
    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    #ejecucion de la busqueda de locales por id
    cursor.execute("""
        SELECT * FROM locales
        WHERE id_l = %s
    """, (id_l,))

    local = cursor.fetchone()

    #ejecucion de la busqueda por  id
    cursor.execute("""
        SELECT * FROM productos
        WHERE id_l = %s
    """, (id_l,))

    productos = cursor.fetchall()

    #se repite
    cursor.close()
    conexion.close()

    #muestra local y productos
    return render_template(
        "local.html",
        local=local,
        productos=productos
    )

@app.route("/admin") #definicion del panel de admin
def admin():

    #lo redirige a index si no tiene secion
    if "id_u" not in session:
        return redirect(url_for("index"))
    
    #si el id es igual a dos te da acceso al panel de admin
    if session["id_r"] != 1:
        return redirect(url_for("inicio"))

    return render_template("admin.html")


#ejecucion de la app 
if __name__ == "__main__":
    app.run(debug=True)
