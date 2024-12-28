import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet'
import {LatLng} from "leaflet";
import * as sat from "satellite.js";

const map = L.map('map');
map.setView([0, 0], 3);
map.on('drag', () => {
  map.fitBounds(map.getBounds());
})

const bounds = new LatLng(50.284863, 11.78527);
const houseIcon = L.icon({
  iconUrl: '/img/house.svg',
  iconSize: [16, 16]
});
const satelliteIcon = L.icon({
  iconUrl: '/img/inmarsat.svg',
  iconSize: [128, 128]
});
const location = L.marker(bounds, { icon: houseIcon });
location.addTo(map);


const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
layer.addTo(map);

const cat_nr = 33591;
const start = new Date(new Date(Date.now()).setMinutes(new Date(Date.now()).getMinutes())).toISOString();
const end = new Date(new Date(Date.now()).setHours(new Date(Date.now()).getHours() + 2)).toISOString();
const sat_request = `http://192.168.168.1:5000/satellite?&cat_nr=${cat_nr}&start=${start}&end=${end}&step=10`;


const popup = L.popup();
function onMapClick(e: any) {
  popup
    .setLatLng(e.latlng)
    .setContent("Map at " + e.latlng.toString())
    .openOn(map);
}

map.on('click', onMapClick);

function get_position(tle1: any, tle2: any) {
  var rec = sat.twoline2satrec(tle1, tle2);
  var p = sat.propagate(rec, new Date())

  var positionGd = sat.eciToGeodetic((p.position as sat.EciVec3<sat.Kilometer>), sat.gstime(new Date(Date.now())));

  var lon = sat.degreesLong(positionGd.longitude)
  var lat = sat.degreesLat(positionGd.latitude)
  return {lat, lon};
}

async function main() {
  const response = await fetch(sat_request, {priority: "high"});
  const json = await response.json();

  json['name'] = json['name']?.trim() ?? "Empty"
  var name = json['name'];
  var tle1 = json['tle1'];
  var tle2 = json['tle2'];
  console.log(name, '\n', tle1, '\n', tle2)

  var {lat, lon} = get_position(tle1, tle2);
  var positionMarker = L.marker(new LatLng(lat, lon), {icon: satelliteIcon});
  positionMarker.bindTooltip(l => name, { permanent: true, direction: "top", offset: [ 0, -10 ] });
  positionMarker.addTo(map);


  L.polyline((json["results"] as Array<any>).map(s => new LatLng(s.lat, s.lon))).addTo(map)

  setInterval(() => {
    var {lat, lon} = get_position(tle1, tle2);
    positionMarker.setLatLng(new LatLng(lat, lon));
  }, 2000)

  // console.log(json)
  //
  // const positions = Array.from(json['results']).map(s => [s.lat, s.lon, s.time])
  // console.log(positions)
  //
  // var markers = positions.map((s, index) => {
  //   var b = L.circleMarker(s, {color: 'red', radius: 2});
  //   b.addTo(map);
  //   return { marker: b, st: s };
  // })
  //
  // console.log(markers)
  //
  // var current = 0;
  //
  // setInterval(() => {
  //   console.log("Interval lol");
  //   var now = new Date(Date.now());
  //   console.log(current, now.toISOString())
  //   if (now.toISOString() > markers[current].st[2]) {
  //     markers[current].marker.setStyle({ color: 'red', radius: 2 });
  //
  //     current++;
  //     markers[current].marker.setStyle({ color: 'green', radius: 16 });
  //   }
  // }, 1000);

}

main();
