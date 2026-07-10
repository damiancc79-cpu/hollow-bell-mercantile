"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Item = {
  id: string;
  name: string;
  price: number;
  color: number;
  shape: "box" | "bottle" | "jar" | "sphere" | "cone";
  x: number;
  z: number;
};

type Choice = { text: string; reply: string; kind: number };

type Scene = {
  day: number;
  phase: "DAY" | "NIGHT";
  npc: keyof typeof NPCS;
  request: string;
  intro: string[];
  after: string;
  choices: [Choice, Choice];
};

const ITEMS: Item[] = [
  { id: "tea", name: "Fog Tea", price: 4, color: 0xc66a4a, shape: "box", x: -3.45, z: 2.8 },
  { id: "salt", name: "Black Salt", price: 5, color: 0x30343b, shape: "jar", x: -3.45, z: 1.35 },
  { id: "sewing", name: "Sewing Kit", price: 6, color: 0x9e3d4f, shape: "box", x: -3.45, z: -0.1 },
  { id: "oil", name: "Lamp Oil", price: 7, color: 0xd6a52c, shape: "bottle", x: -3.45, z: -1.55 },
  { id: "soap", name: "Violet Soap", price: 3, color: 0x8e67b1, shape: "box", x: -1.7, z: 1.1 },
  { id: "twine", name: "Red Twine", price: 4, color: 0xa9343b, shape: "sphere", x: -0.55, z: 1.1 },
  { id: "whistle", name: "Tin Whistle", price: 5, color: 0xaeb8b7, shape: "bottle", x: 0.6, z: 1.1 },
  { id: "tonic", name: "Blue Tonic", price: 8, color: 0x397fa3, shape: "bottle", x: 1.75, z: 1.1 },
  { id: "button", name: "Bone Button", price: 2, color: 0xd8cdb1, shape: "sphere", x: 3.45, z: 2.8 },
  { id: "candle", name: "Grave Candle", price: 6, color: 0xe7d397, shape: "cone", x: 3.45, z: 1.35 },
  { id: "preserves", name: "Pear Preserves", price: 5, color: 0x9fa948, shape: "jar", x: 3.45, z: -0.1 },
  { id: "mirror", name: "Pocket Mirror", price: 9, color: 0xc9d8db, shape: "sphere", x: 3.45, z: -1.55 },
  { id: "key", name: "Brass Key", price: 1, color: 0xc89332, shape: "box", x: -1.7, z: 3.55 },
  { id: "stars", name: "Paper Stars", price: 4, color: 0xe8b35f, shape: "cone", x: 0, z: 3.55 },
  { id: "milk", name: "Moon Milk", price: 5, color: 0xdbe9e5, shape: "bottle", x: 1.7, z: 3.55 },
];

const NPCS = {
  mara: { name: "Mara Vale", role: "The postwoman", color: 0xcf6b4a, trait: "Bright, brave, never on time" },
  finch: { name: "Mr. Finch", role: "The clockmender", color: 0x7b8096, trait: "Exacting, watchful, afraid of bells" },
  odo: { name: "Odo Brill", role: "The ferryman", color: 0x56755b, trait: "Warm laugh, river-cold hands" },
  mirel: { name: "Mirel Ash", role: "The botanist", color: 0x7d5f88, trait: "Gentle, uncanny, speaks to roots" },
  june: { name: "Sister June", role: "The chapel keeper", color: 0xb19a72, trait: "Kind eyes, a locked-away guilt" },
} as const;

const SCENES: Scene[] = [
  { day: 1, phase: "DAY", npc: "mara", request: "tea", intro: ["Morning, new shopkeep! Fog Tea, please — the hill route bites today.", "My brother Ewan used to mind this counter. If you find his old ledger... don't read the last page."], after: "Still tastes like burnt oranges. He taught you the recipe, didn't he?", choices: [{ text: "I found it in the drawer.", reply: "Then the shop was waiting for you. Strange... but welcome.", kind: 1 }, { text: "I don't know any Ewan.", reply: "Of course. Sorry. You have the same tired eyes.", kind: 0 }] },
  { day: 1, phase: "NIGHT", npc: "finch", request: "oil", intro: ["Lock the door after me.", "Lamp Oil. One bottle. And if the brass bell rings by itself, do not answer it."], after: "The bell rang the night Ewan vanished. Three times. There was no wind.", choices: [{ text: "What answered?", reply: "Something under the floorboards. It knew my name.", kind: 0 }, { text: "You can stay until dawn.", reply: "Kindness makes poor armor, shopkeeper... but thank you.", kind: 1 }] },
  { day: 2, phase: "DAY", npc: "odo", request: "sewing", intro: ["A sewing kit! River tore my good coat and my dignity in one bite.", "Found another coat snagged downstream. Ewan's initials inside. Funny old river, returning things late."], after: "Keep the change. Buy yourself a lock for that cellar hatch.", choices: [{ text: "You saw the hatch?", reply: "Every shop in town has one. Only yours breathes.", kind: 0 }, { text: "I'll mend your coat.", reply: "Ha! A merchant with useful hands. Ewan would've liked you.", kind: 1 }] },
  { day: 2, phase: "NIGHT", npc: "mirel", request: "salt", intro: ["Black Salt. A ring of it around your bed.", "The shop has begun remembering. At night, memories wear the shapes of people."], after: "Do not trust a face merely because you miss it.", choices: [{ text: "What does the shop want?", reply: "A keeper. It always wants a keeper.", kind: 0 }, { text: "Are you trying to protect me?", reply: "I am trying again. That is not quite the same thing.", kind: 1 }] },
  { day: 3, phase: "DAY", npc: "june", request: "soap", intro: ["Violet Soap for the chapel linens, please.", "Your window was lit last night. For one hopeful second, I thought Ewan had come home."], after: "Scent is cruel. This was his favorite.", choices: [{ text: "Tell me what happened.", reply: "Not in daylight. Guilt needs shadows before it speaks.", kind: 0 }, { text: "You miss him too.", reply: "Every bell in my chapel sounds like an apology.", kind: 1 }] },
  { day: 3, phase: "NIGHT", npc: "mara", request: "mirror", intro: ["A Pocket Mirror. Quickly.", "I saw Ewan in your dark window. He was standing exactly where you are."], after: "The glass shows two of you. One is soaked to the bone.", choices: [{ text: "Ask him what he wants.", reply: "He says: remember the flood.", kind: 0 }, { text: "Put the mirror away.", reply: "Yes. Some doors are silver and small.", kind: 1 }] },
  { day: 4, phase: "DAY", npc: "finch", request: "whistle", intro: ["A Tin Whistle. My granddaughter turns seven today.", "This one belonged to Ewan. I repaired it after the flood, though he never returned for it."], after: "He played one note when the water rose. The river stopped at every doorstep but this one.", choices: [{ text: "The shop stopped it?", reply: "The shop — or the person it kept inside.", kind: 0 }, { text: "Give it to her from Ewan.", reply: "I will. Let one memory arrive sweetly.", kind: 1 }] },
  { day: 4, phase: "NIGHT", npc: "odo", request: "button", intro: ["Bone Button. Lost one from the coat the river gave back.", "Someone is walking beneath us. Same pace as you, half a heartbeat late."], after: "This button was carved from the old bell-ringer's knuckle. Town traditions are ugly things.", choices: [{ text: "Help me open the cellar.", reply: "Not yet. The river is listening at the drain.", kind: 1 }, { text: "That's only a story.", reply: "Then why are you whispering?", kind: 0 }] },
  { day: 5, phase: "DAY", npc: "mirel", request: "stars", intro: ["Paper Stars. The children hang them before storms.", "Seven years ago, Ewan folded one for every person in town. He made none for himself."], after: "The roots under your shop grow through a room full of bells.", choices: [{ text: "Can the shop be destroyed?", reply: "Yes. But so can a dam.", kind: 0 }, { text: "Can Ewan be freed?", reply: "A kind question. The answer will hurt you.", kind: 1 }] },
  { day: 5, phase: "NIGHT", npc: "june", request: "tonic", intro: ["Blue Tonic. My hands won't stop shaking.", "I locked Ewan in the bell room during the flood. He asked me to. I told Mara he'd already fled."], after: "His ringing held the river back. By dawn, the shop was empty and he was part of its song.", choices: [{ text: "You sacrificed him.", reply: "Yes. And called it mercy because the town survived.", kind: 0 }, { text: "You were afraid.", reply: "I was. Your gentleness is worse than anger.", kind: 1 }] },
  { day: 6, phase: "DAY", npc: "mara", request: "key", intro: ["The Brass Key. I know you've kept it under the stars.", "A storm is coming tonight. I am done letting everyone protect me with lies."], after: "The key is warm. Ewan's hand used to be warm.", choices: [{ text: "We'll open it together.", reply: "Together. Whatever is down there, it doesn't get another Vale alone.", kind: 1 }, { text: "Leave town, Mara.", reply: "You sound exactly like him. That is why I won't.", kind: 0 }] },
  { day: 6, phase: "NIGHT", npc: "finch", request: "candle", intro: ["A Grave Candle. Set it by the hatch and listen carefully.", "The storm returns every seven years. The bell requires a living hand. Ewan's echo is fading."], after: "At dawn, the river will choose: the town, or the next keeper.", choices: [{ text: "There must be another way.", reply: "I spent seven years building clocks because I could not build more time.", kind: 0 }, { text: "Keep Mara safe.", reply: "I failed her brother. I will not fail her twice.", kind: 1 }] },
  { day: 7, phase: "DAY", npc: "odo", request: "preserves", intro: ["Pear Preserves. Ewan's favorite. We thought you should have breakfast.", "Nobody will say goodbye. Cowards, all of us. So I'll say it for them: you made this place feel alive."], after: "The river is over the east road. By midnight, it reaches the square.", choices: [{ text: "Take everyone uphill.", reply: "Already done. But Mara won't leave the bell.", kind: 1 }, { text: "Was I ever free to choose?", reply: "No. That is the oldest cruelty in town.", kind: 0 }] },
  { day: 7, phase: "NIGHT", npc: "mara", request: "twine", intro: ["Red Twine. Ewan tied it around my wrist whenever I got lost.", "The cellar is open. The bell rope is waiting. I finally understand why the shop chose you."], after: "Because you would love strangers enough to stay.", choices: [{ text: "Tie the twine to my wrist.", reply: "I will remember the way back for both of you.", kind: 1 }, { text: "Tell them I was afraid.", reply: "I will tell them you were afraid — and rang anyway.", kind: 1 }] },
];

const itemById = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

function makeLabel(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(18,19,18,.86)";
  ctx.roundRect(4, 4, 504, 88, 16);
  ctx.fill();
  ctx.fillStyle = "#f1ddac";
  ctx.font = "600 34px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.75, 0.33, 1);
  return sprite;
}

function Scene3D({
  scene,
  heldId,
  frozen,
  onNearby,
  actionSignal,
}: {
  scene: Scene;
  heldId: string | null;
  frozen: boolean;
  onNearby: (value: { type: "item" | "npc"; id: string; name: string } | null) => void;
  actionSignal: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const heldRef = useRef(heldId);
  const frozenRef = useRef(frozen);
  const onNearbyRef = useRef(onNearby);
  const actionRef = useRef(0);

  useEffect(() => { heldRef.current = heldId; }, [heldId]);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);
  useEffect(() => { onNearbyRef.current = onNearby; }, [onNearby]);
  useEffect(() => { actionRef.current = actionSignal; }, [actionSignal]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(scene.phase === "DAY" ? 0x9ba994 : 0x111827);
    threeScene.fog = new THREE.Fog(scene.phase === "DAY" ? 0x9ba994 : 0x111827, 11, 25);
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 50);
    camera.position.set(0, 1.55, 3.95);
    camera.lookAt(0, 1.45, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = scene.phase === "DAY" ? 1.05 : 0.78;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(scene.phase === "DAY" ? 0xffe4bd : 0x5d6ca8, scene.phase === "DAY" ? 0x4c4d3d : 0x17151c, scene.phase === "DAY" ? 2.5 : 1.2);
    threeScene.add(ambient);
    const sun = new THREE.DirectionalLight(scene.phase === "DAY" ? 0xffc77e : 0x98a9e9, scene.phase === "DAY" ? 3.8 : 1.8);
    sun.position.set(-5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    threeScene.add(sun);
    if (scene.phase === "NIGHT") {
      const red = new THREE.PointLight(0xc35245, 13, 8);
      red.position.set(0, 2.7, -3.7);
      threeScene.add(red);
    }

    const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial({ color, roughness: 0.84 }));
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      threeScene.add(mesh);
      return mesh;
    };

    addBox(0, -0.16, 0, 9.8, 0.3, 9.8, 0x5b4634);
    for (let i = -4; i <= 4; i++) addBox(i * 1.1, 0.01, 0, 0.045, 0.03, 9.5, 0x32261f);
    addBox(-4.85, 2.1, 0, 0.25, 4.4, 9.8, 0x3d322b);
    addBox(4.85, 2.1, 0, 0.25, 4.4, 9.8, 0x3d322b);
    addBox(0, 2.1, -4.85, 9.8, 4.4, 0.25, 0x49362d);
    addBox(0, 4.3, 0, 9.8, 0.18, 9.8, 0x241d19);
    addBox(0, 0.75, -2.7, 5.1, 1.45, 0.85, 0x513827);
    addBox(0, 1.55, -2.7, 5.35, 0.14, 1.02, 0x7d5533);
    addBox(0, 0.04, 1.1, 4.7, 0.08, 1.2, 0x3a2d25);
    for (const x of [-3.75, 3.75]) {
      addBox(x, 0.72, 0.7, 1.55, 0.15, 7.3, 0x7b5534);
      for (const z of [-2.15, -0.7, 0.75, 2.2, 3.65]) addBox(x, 0.38, z, 1.5, 0.65, 0.78, 0x4c3729);
    }
    addBox(-2.55, 2.3, -4.68, 1.65, 3.2, 0.18, 0x231b18);
    addBox(-2.55, 2.3, -4.55, 1.3, 2.75, 0.08, scene.phase === "DAY" ? 0x6f897f : 0x182338);
    addBox(2.6, 1.55, -4.62, 1.25, 0.12, 0.18, 0x9b733d);
    const sign = makeLabel("HOLLOW BELL · EST. 1881");
    sign.position.set(2.6, 2.15, -4.45);
    sign.scale.set(2.5, 0.46, 1);
    threeScene.add(sign);

    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 16), new THREE.MeshStandardMaterial({ color: 0xb6842f, metalness: 0.7, roughness: 0.3 }));
    bell.rotation.x = Math.PI;
    bell.position.set(0, 3.35, -2.35);
    threeScene.add(bell);

    const playerPosition = new THREE.Vector3(0, 0, 3.95);
    let yaw = 0;
    let pitch = -0.06;

    const npcData = NPCS[scene.npc];
    const npc = new THREE.Group();
    const npcBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 1, 8), new THREE.MeshStandardMaterial({ color: npcData.color }));
    npcBody.position.y = 0.72;
    npcBody.castShadow = true;
    const npcHead = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 12), new THREE.MeshStandardMaterial({ color: 0xb98262 }));
    npcHead.position.y = 1.42;
    npcHead.castShadow = true;
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.3, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x292525 }));
    hat.position.y = 1.7;
    npc.add(npcBody, npcHead, hat);
    npc.position.set(0, 0, -3.55);
    npc.rotation.y = Math.PI;
    threeScene.add(npc);
    const npcLabel = makeLabel(npcData.name);
    npcLabel.position.set(0, 2.15, -3.55);
    threeScene.add(npcLabel);

    const itemMeshes = new Map<string, THREE.Group>();
    for (const item of ITEMS) {
      const group = new THREE.Group();
      let geometry: THREE.BufferGeometry;
      if (item.shape === "bottle") geometry = new THREE.CylinderGeometry(0.12, 0.18, 0.52, 10);
      else if (item.shape === "jar") geometry = new THREE.CylinderGeometry(0.21, 0.21, 0.38, 12);
      else if (item.shape === "sphere") geometry = new THREE.SphereGeometry(0.22, 12, 10);
      else if (item.shape === "cone") geometry = new THREE.ConeGeometry(0.2, 0.52, 12);
      else geometry = new THREE.BoxGeometry(0.42, 0.32, 0.34);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.55, metalness: item.id === "mirror" || item.id === "key" ? 0.65 : 0.05 }));
      mesh.position.y = 0.68;
      mesh.castShadow = true;
      group.add(mesh);
      const label = makeLabel(item.name);
      label.position.y = 1.18;
      label.scale.set(1.25, 0.235, 1);
      group.add(label);
      group.position.set(item.x, 0, item.z);
      threeScene.add(group);
      itemMeshes.set(item.id, group);
    }

    const keys = new Set<string>();
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
      keys.add(key);
    };
    const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let looking = false;
    let pointerX = 0;
    let pointerY = 0;
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      looking = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!looking || frozenRef.current) return;
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      yaw -= dx * 0.004;
      pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -0.72, 0.72);
    };
    const pointerUp = () => { looking = false; };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerUp);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let animationId = 0;
    let last = performance.now();
    let previousNear = "";
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      if (!frozenRef.current) {
        let forwardInput = 0;
        let strafeInput = 0;
        if (keys.has("w") || keys.has("arrowup")) forwardInput += 1;
        if (keys.has("s") || keys.has("arrowdown")) forwardInput -= 1;
        if (keys.has("a") || keys.has("arrowleft")) strafeInput -= 1;
        if (keys.has("d") || keys.has("arrowright")) strafeInput += 1;
        const length = Math.hypot(forwardInput, strafeInput) || 1;
        forwardInput /= length;
        strafeInput /= length;
        const forwardX = Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = Math.sin(yaw);
        playerPosition.x = THREE.MathUtils.clamp(playerPosition.x + (forwardX * forwardInput + rightX * strafeInput) * dt * 2.35, -4.25, 4.25);
        playerPosition.z = THREE.MathUtils.clamp(playerPosition.z + (forwardZ * forwardInput + rightZ * strafeInput) * dt * 2.35, -2.05, 4.25);
      }
      const moving = keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d") || keys.has("arrowup") || keys.has("arrowdown") || keys.has("arrowleft") || keys.has("arrowright");
      const bob = moving && !frozenRef.current ? Math.sin(now * 0.011) * 0.025 : 0;
      camera.position.set(playerPosition.x, 1.55 + bob, playerPosition.z);
      const lookDirection = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(camera.position.clone().add(lookDirection));
      itemMeshes.forEach((group, id) => {
        group.visible = heldRef.current !== id;
        if (group.visible) group.children[0].rotation.y = now * 0.0007;
      });
      let near: { type: "item" | "npc"; id: string; name: string } | null = null;
      let best = 1.05;
      if (heldRef.current) {
        const dist = Math.hypot(playerPosition.x - npc.position.x, playerPosition.z - npc.position.z);
        if (dist < 1.9) near = { type: "npc", id: scene.npc, name: npcData.name };
        const held = itemMeshes.get(heldRef.current);
        if (held) {
          held.visible = true;
          held.position.set(playerPosition.x + lookDirection.x * 0.72, 0.68 + lookDirection.y * 0.2, playerPosition.z + lookDirection.z * 0.72);
          held.scale.setScalar(0.58);
          held.children[1].visible = false;
        }
      } else {
        for (const item of ITEMS) {
          const dist = Math.hypot(playerPosition.x - item.x, playerPosition.z - item.z);
          if (dist < best) {
            best = dist;
            near = { type: "item", id: item.id, name: item.name };
          }
        }
      }
      const nearKey = near ? `${near.type}:${near.id}` : "";
      if (nearKey !== previousNear) {
        previousNear = nearKey;
        onNearbyRef.current(near);
      }
      bell.rotation.z = scene.phase === "NIGHT" ? Math.sin(now * 0.002) * 0.08 : 0;
      renderer.render(threeScene, camera);
      animationId = requestAnimationFrame(tick);
    };
    animationId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerUp);
      renderer.dispose();
      renderer.domElement.remove();
      threeScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
    };
  }, [scene]);

  return <div className="scene3d" ref={mountRef} aria-label="3D interior of the Hollow Bell shop" />;
}

export function HollowBellGame() {
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [nearby, setNearby] = useState<{ type: "item" | "npc"; id: string; name: string } | null>(null);
  const [dialogueMode, setDialogueMode] = useState<"intro" | "after" | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [choiceReply, setChoiceReply] = useState<string | null>(null);
  const [coins, setCoins] = useState(12);
  const [kindness, setKindness] = useState(0);
  const [wrongItem, setWrongItem] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [actionSignal, setActionSignal] = useState(0);
  const [sceneReset, setSceneReset] = useState(0);
  const scene = SCENES[sceneIndex];
  const requested = itemById[scene.request];
  const npc = NPCS[scene.npc];

  const begin = () => {
    setStarted(true);
    setDialogueMode("intro");
    setLineIndex(0);
  };

  const advanceIntro = () => {
    if (lineIndex < scene.intro.length - 1) setLineIndex((value) => value + 1);
    else {
      setDialogueMode(null);
      setLineIndex(0);
    }
  };

  const chooseReply = (choice: Choice) => {
    setChoiceReply(choice.reply);
    setKindness((value) => value + choice.kind);
  };

  const finishScene = () => {
    setDialogueMode(null);
    setChoiceReply(null);
    setHeldId(null);
    setNearby(null);
    setWrongItem(null);
    if (sceneIndex === SCENES.length - 1) {
      setEnding(true);
      return;
    }
    const next = sceneIndex + 1;
    setSceneIndex(next);
    setTimeout(() => {
      setDialogueMode("intro");
      setLineIndex(0);
    }, 450);
  };

  const interact = useCallback(() => {
    setActionSignal((value) => value + 1);
    if (!started || ending) return;
    if (dialogueMode === "intro") {
      advanceIntro();
      return;
    }
    if (dialogueMode === "after") return;
    if (!nearby) return;
    setWrongItem(null);
    if (nearby.type === "item" && !heldId) {
      setHeldId(nearby.id);
      setNearby(null);
      return;
    }
    if (nearby.type === "npc" && heldId) {
      if (heldId === scene.request) {
        setCoins((value) => value + requested.price);
        setHeldId(null);
        setDialogueMode("after");
        setChoiceReply(null);
      } else {
        setWrongItem(`${npc.name} shakes their head. “I asked for ${requested.name}, not ${itemById[heldId].name}.”`);
        setHeldId(null);
        setNearby(null);
        setSceneReset((value) => value + 1);
      }
    }
  }, [dialogueMode, ending, heldId, nearby, npc.name, requested.name, requested.price, scene.request, started]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "e" || event.key === " ") {
        event.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interact]);

  const prompt = useMemo(() => {
    if (dialogueMode || ending) return null;
    if (!nearby) return heldId ? `Carry ${itemById[heldId].name} to ${npc.name}` : "Walk near an item";
    if (nearby.type === "item") return `E · Pick up ${nearby.name}`;
    return `E · Give ${itemById[heldId!].name} to ${npc.name}`;
  }, [dialogueMode, ending, heldId, nearby, npc.name]);

  return (
    <main className={`game-shell ${scene.phase === "NIGHT" ? "is-night" : "is-day"}`}>
      <header className="topbar">
        <div className="brand"><span className="bell-mark">⌁</span><div><b>THE HOLLOW BELL</b><small>MISCELLANEOUS GOODS · EST. 1881</small></div></div>
        <div className="status-strip">
          <span><i className="status-dot" /> DAY {scene.day} / 7</span>
          <span className="phase">{scene.phase === "DAY" ? "☀" : "☾"} {scene.phase}</span>
          <span>¢ {coins}</span>
        </div>
      </header>

      <section className="game-grid">
        <aside className="order-card paper-panel">
          <p className="eyebrow">CURRENT ORDER</p>
          <h2>{requested.name}</h2>
          <div className="npc-card">
            <div className="portrait" style={{ "--npc": `#${npc.color.toString(16).padStart(6, "0")}` } as React.CSSProperties}><span>●</span></div>
            <div><b>{npc.name}</b><small>{npc.role}</small></div>
          </div>
          <p className="trait">“{npc.trait}”</p>
          <div className="price-row"><span>SALE</span><b>¢ {requested.price}</b></div>
          <p className="objective">Find it on the shelves, pick it up, then bring it to the counter.</p>
        </aside>

        <section className="viewport-wrap">
          <Scene3D key={`${sceneIndex}-${sceneReset}`} scene={scene} heldId={heldId} frozen={!started || Boolean(dialogueMode) || ending} onNearby={setNearby} actionSignal={actionSignal} />
          <div className="crosshair" aria-hidden="true"><i /><i /></div>
          <div className="weather-label">{scene.phase === "DAY" ? "THE FOG IS LIFTING" : "STORM WARNING · BELL TIDE RISING"}</div>
          {heldId && <div className="held-pill">CARRYING <b>{itemById[heldId].name}</b></div>}
          {prompt && <button className="interact-prompt" onClick={interact}>{prompt}</button>}
          {wrongItem && <div className="wrong-item">{wrongItem}</div>}
          <div className="mobile-pad" aria-label="Touch movement controls">
            <button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }))}>↑</button>
            <button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }))}>←</button>
            <button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "s" }))}>↓</button>
            <button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "d" }))}>→</button>
          </div>
        </section>

        <aside className="ledger paper-panel">
          <div className="ledger-head"><div><p className="eyebrow">SHOP LEDGER</p><h3>Stock · 15</h3></div><span>Ⅲ</span></div>
          <div className="stock-list">
            {ITEMS.map((item) => <div key={item.id} className={item.id === scene.request ? "wanted" : ""}><i style={{ backgroundColor: `#${item.color.toString(16).padStart(6, "0")}` }} /><span>{item.name}</span><b>¢{item.price}</b></div>)}
          </div>
        </aside>
      </section>

      <footer className="controls"><span><kbd>WASD</kbd> / <kbd>ARROWS</kbd> MOVE</span><span><kbd>DRAG</kbd> LOOK</span><span><kbd>E</kbd> / <kbd>SPACE</kbd> INTERACT</span><span className="story-meter">STORY <i>{SCENES.map((_, i) => <em key={i} className={i <= sceneIndex ? "filled" : ""} />)}</i></span></footer>

      {!started && (
        <div className="overlay title-overlay">
          <div className="title-card">
            <p className="eyebrow">A SEVEN-DAY SHOPKEEPING TALE</p>
            <div className="big-bell">⌁</div>
            <h1>THE HOLLOW<br />BELL</h1>
            <p>You inherited a shop nobody remembers selling.<br />Serve the town. Learn their secrets. Survive the seventh night.</p>
            <button onClick={begin}>OPEN FOR BUSINESS <span>→</span></button>
            <small>First-person · Built for Chrome · Keyboard and touch controls · 10–15 minutes</small>
          </div>
        </div>
      )}

      {dialogueMode && (
        <div className="dialogue-wrap">
          <div className="dialogue-box">
            <div className="speaker-tab"><span style={{ background: `#${npc.color.toString(16).padStart(6, "0")}` }} /> {npc.name} <small>{scene.phase}</small></div>
            <p>{dialogueMode === "intro" ? scene.intro[lineIndex] : (choiceReply ?? scene.after)}</p>
            {dialogueMode === "after" && !choiceReply ? (
              <div className="choices">{scene.choices.map((choice) => <button key={choice.text} onClick={() => chooseReply(choice)}>{choice.text}</button>)}</div>
            ) : (
              <button className="continue" onClick={dialogueMode === "intro" ? advanceIntro : finishScene}>{dialogueMode === "intro" && lineIndex < scene.intro.length - 1 ? "CONTINUE" : dialogueMode === "after" ? "CLOSE SHOP" : "BEGIN ORDER"} <span>→</span></button>
            )}
          </div>
        </div>
      )}

      {ending && (
        <div className="overlay ending-overlay">
          <div className="ending-card">
            <p className="eyebrow">THE SEVENTH NIGHT</p>
            <h2>THE BELL RANG<br />UNTIL MORNING.</h2>
            <p>The river stopped at every doorstep but yours.</p>
            <p>At dawn, the Hollow Bell was gone. In the mud, Mara found one length of red twine, tied around a warm brass clapper. Once a year she leaves Fog Tea on the empty lot. Once a year, from far below, you ring twice.</p>
            <div className="epitaph">THE TOWN LIVED.<br /><b>THE SHOPKEEPER DID NOT.</b></div>
            <small>{kindness >= 7 ? "They remember you as a friend, not a hero. You would have preferred that." : "They carved your name beside Ewan’s, though nobody knew where you came from."}</small>
            <button onClick={() => window.location.reload()}>PLAY AGAIN <span>↻</span></button>
          </div>
        </div>
      )}
    </main>
  );
}
