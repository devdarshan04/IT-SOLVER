import fs from 'fs';
import path from 'path';

// Import Ge from runtime-chunk-ADHKZQMB.js
import { o as Ge, l as Ie } from './node_modules/@splinetool/runtime/build/runtime-chunk-ADHKZQMB.js';

const buf = fs.readFileSync('./public/scene.splinecode');
const [doc, tracker] = Ie(Ge.deserialize(new Uint8Array(buf)));
const sceneData = tracker.result().data;

console.log('Scene deserialized successfully!');
console.log('Schema:', doc.schema);
console.log('sceneData keys:', Object.keys(sceneData));
console.log('scene keys:', Object.keys(sceneData.scene));

// Let's inspect sceneData.scene.objects
const objects = sceneData.scene.objects;
console.log('objects type:', typeof objects, Object.prototype.toString.call(objects));
function traverse(node, depth = 0) {
  const data = node.data || node;
  const id = node.id || data.id;
  const name = data.name || 'Unnamed';
  
  if (data.events && data.events.length > 0) {
    console.log(`\n${' '.repeat(depth)}[${id}] "${name}" has ${data.events.length} events:`);
    for (const ev of data.events) {
      console.log(`${' '.repeat(depth + 2)}Event type=${ev.type} name="${ev.name}":`);
      for (const act of ev.actions || []) {
        console.log(`${' '.repeat(depth + 4)}Action: type=${act.type || act.actionType} object=${act.object}`);
        if (act.tweens) {
          console.log(`${' '.repeat(depth + 6)}Tweens:`, JSON.stringify(act.tweens));
        }
      }
    }
  }

  if (data.states) {
    console.log(`${' '.repeat(depth)}[${id}] "${name}" raw states:`, Object.entries(data.states).map(([k, v]) => ({ key: k, id: v.id, name: v.name })));
  }

  if (node.children) {
    for (const child of node.children) {
      traverse(child, depth + 2);
    }
  }
}

for (const rootNode of sceneData.scene.objects) {
  traverse(rootNode);
}
