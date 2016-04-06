
var request = require("request");
var LineByLineReader = require('line-by-line');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../nestoria.db');
var places=[];
var async = require('async');
var check;
var index;
var cpaginacion=1;
var cambio=false;
var contador=0;

function insertData(c,price,size,longitude,latitude,property_type,callback){
 db.serialize(function() {
  var stmt = db.prepare("INSERT INTO casas VALUES (?,?,?,?,?,?)");
  stmt.run(c,price,size,longitude,latitude,property_type,function(){
   // console.log("fin transaccion");
    callback();
});
 });
}

function peticion(url,str,i,c){
   //console.log("realizando nueva peticion.........."+c);
    
    request({
        url: url,
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0'
        },
        port: 80,
        json: true
        }, function (error, response,body) {
            
        if (!error) {
            
            //console.log("callback");
            var sum=0,medias=0;
            var respuesta=body.response;
            var fin;
            if(respuesta){
                var resp=respuesta.listings;

                if(resp && resp.length>1){
                 //console.log(resp.length);
                resp.forEach(function(item,next){
                var remaining = resp.length;

                    if(item.size>0 && item.price){
                       //console.log(item.hasOwnProperty('price'));
                       //console.log(item.listing_type);
                        insertData(c,item.price,item.latitude,item.longitude,item.size,item.listing_type,function(){                    
                            if (!--remaining){ //console.log("nueva entrada"); 
                                next();
                            }
                        });
                    }
                    
                });
                //console.log("fin peticion "+c);
                        c++;
                        paginar(str,i,c,false,cambio);
                }
                else{
                    console.log("NO RESP");
                    paginar(str,i,c,true,cambio);
                }
              
            }
            else{
                console.log("no hay datos");
            }
        }
        else{
                console.log("error!!!!!!! ->"+error+ " volviendo a hacer la peticion "+c);
                paginar(str,i,c,true,cambio);
            }

        });
}


function handleFile(file,callback){
    var lr = new LineByLineReader(file);
    lr.on('error', function (err) {
        console.log("error al leer el documento de texto");
    });

    lr.on('line', function (line) {
        places.push(line);
        //places[line]=line;
    });

    lr.on('end', function () {
       // console.log("fin del documento");
        return callback();
    });
}

function procesa(i){
    //console.log("procesando...");
    switch(cambio){
    case false:
        if(i<places.length){
        var item=places[i];
        
            var escaped_str = require('querystring').escape(item);
            console.log("un sitio: "+escaped_str);
            var err=false;
            var index=1;
            //cpaginacion=1;
            paginar(escaped_str,i, cpaginacion,cambio);
        }
        else{
            console.log("fin de pueblos");
            cambio=true;
            //cpaginacion=0;
            procesa(0);
            //paginarsec();
            //peticion2();
        }
        break;
    case true:
        if(i<places.length){
        var item=places[i];
        
        var escaped_str = require('querystring').escape(item);
        console.log("un sitio para comprobar tipo RENT: "+escaped_str);
            //var err=false;
            //cpaginacion=1;
            //cpaginacion=1;
            paginar(escaped_str,i, cpaginacion,false,cambio);
        }
        else{
            console.log("fin de pueblos");
            
            
            //paginarsec();
            //peticion2();
        }
        break;
    } 
}

function paginar(escaped_str,i, cpaginacion,error,cambio){

    //console.log("entro en paginar. cpaginacion= "+cpaginacion+" error "+error);
    if(!cambio)
        var url = "http://api.nestoria.es/api?action=search_listings&country=es&encoding=json&listing_type=buy&page="+cpaginacion+"&place_name="+escaped_str+"&pretty=1&number_of_results=50&bedroom_min=1&bedroom_max=30";
    else
        var url = "http://api.nestoria.es/api?action=search_listings&country=es&encoding=json&listing_type=rent&page="+cpaginacion+"&place_name="+escaped_str+"&pretty=1&number_of_results=50";
    
    //var ukurl = "http://api.nestoria.co.uk/api?action=search_listings&country=uk&encoding=json&listing_type=buy&page="+cpaginacion+"&place_name="+escaped_str+"&pretty=1&number_of_results=50";
   // var securl = "http://172.17.4.14/nestoria.php?location="+escaped_str+"&listing_type=buy&property_type=property&offset="+cpaginacion;
    if(cpaginacion==340 || error){
        console.log("terminado sitio: "+escaped_str+" paginas: "+cpaginacion);
        i++;
        procesa(i);
    }else{
        //console.log("no he llegado al fin de paginas,hago otra peticion "+cpaginacion);
        peticion(url, escaped_str,i, cpaginacion);
        //peticion2(securl, escaped_str,i, cpaginacion);

    }
}


handleFile('places.txt',function(){
    index=0;
    procesa(index);
});