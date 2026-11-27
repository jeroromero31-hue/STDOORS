import{V as C,Q as k,D as U,l as M,N as I}from"./three.module-Bkz_0xJa.js";import{s as R,d as D,z as Z}from"./fflate.module-BsKZ7uZL.js";class oe{parse(t,s,n,o){this.parseAsync(t,o).then(s).catch(n)}async parseAsync(t,s={}){s=Object.assign({ar:{anchoring:{type:"plane"},planeAnchoring:{alignment:"horizontal"}},includeAnchoringProperties:!0,quickLookCompatible:!1,maxTextureSize:1024},s);const n={},o="model.usda";n[o]=null;let i=E(s.animation);i+=H(s);const u={},r={};t.traverseVisible(a=>{if(a.isMesh){const c=a.geometry,f=a.material;if(f.isMeshStandardMaterial){const l="geometries/Geometry_"+c.id+".usda";if(!(l in n)){const d=X(c);n[l]=L(d)}f.uuid in u||(u[f.uuid]=f),i+=V(a,c,f,s.animation?s.animation.matrices.get(a):null)}else console.warn("THREE.USDZExporter: Unsupported material type (USDZ only supports MeshStandardMaterial)",a)}else a.isCamera&&(i+=ee(a))}),i+=F(s),i+=q(u,r,s.quickLookCompatible),n[o]=R(i),i=null;for(const a in r){let c=r[a];c.isCompressedTexture===!0&&(c=D(c));const f=z(c.image,c.flipY,s.maxTextureSize),l=await new Promise(d=>f.toBlob(d,"image/png",1));n[`textures/Texture_${a}.png`]=new Uint8Array(await l.arrayBuffer())}let h=0;for(const a in n){const c=n[a],f=34+a.length;h+=f;const l=h&63;if(l!==4){const d=64-l,p=new Uint8Array(d);n[a]=[c,{extra:{12345:p}}]}h=c.length}return Z(n,{level:0})}}function z(e,t,s){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const n=s/Math.max(e.width,e.height),o=document.createElement("canvas");o.width=e.width*Math.min(1,n),o.height=e.height*Math.min(1,n);const i=o.getContext("2d");return t===!0&&(i.translate(0,o.height),i.scale(1,-1)),i.drawImage(e,0,0,o.width,o.height),o}else throw new Error("THREE.USDZExporter: No valid image data found. Unable to process texture.")}const $=7;function E(e){return`#usda 1.0
(
	customLayerData = {
		string creator = "Three.js USDZExporter (ST Doors, con animación)"
	}
	defaultPrim = "Root"
	metersPerUnit = 1
	upAxis = "Y"${e?`
	startTimeCode = 0
	endTimeCode = ${e.frames-1}
	timeCodesPerSecond = ${e.fps}
	framesPerSecond = ${e.fps}`:""}
)

`}function H(e){return`def Xform "Root"
{
	def Scope "Scenes" (
		kind = "sceneLibrary"
	)
	{
		def Xform "Scene" (
			prepend apiSchemas = ["Preliminary_AnchoringAPI"]
			customData = {
				bool preliminary_collidesWithEnvironment = 0
				string sceneName = "Scene"
			}
			sceneName = "Scene"
		)
		{${e.includeAnchoringProperties===!0?`
		token preliminary:anchoring:type = "${e.ar.anchoring.type}"
		token preliminary:planeAnchoring:alignment = "${e.ar.planeAnchoring.alignment}"
	`:""}
		def Xform "Puerta"
		{
`}function F(e={}){return`
		}
${e.behaviors||""}
		}
	}
}

`}function L(e){let t=E();return t+=e,R(t)}const y=new C,x=new k,_=new C,m=e=>Number(e.toPrecision($));function N(e,t,s,n){const o="Object_"+e.id,i=[],u=[],r=[],h=[],a=[],c=[];n.forEach(l=>{l.decompose(y,x,_),h.push(`(${m(y.x)}, ${m(y.y)}, ${m(y.z)})`),a.push(`(${m(x.w)}, ${m(x.x)}, ${m(x.y)}, ${m(x.z)})`),c.push(`(${m(_.x)}, ${m(_.y)}, ${m(_.z)})`)});const f=(l,d)=>l.forEach((p,g)=>{(g===0||g===l.length-1||p!==l[g-1]||p!==l[g+1])&&d.push(`${g}: ${p}`)});return f(h,i),f(a,u),f(c,r),`def Xform "${o}" (
	prepend references = @./geometries/Geometry_${t.id}.usda@</Geometry>
	prepend apiSchemas = ["MaterialBindingAPI"]
)
{
	double3 xformOp:translate.timeSamples = {
		${i.join(`,
		`)}
	}
	quatf xformOp:orient.timeSamples = {
		${u.join(`,
		`)}
	}
	float3 xformOp:scale.timeSamples = {
		${r.join(`,
		`)}
	}
	uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:orient", "xformOp:scale"]

	rel material:binding = </Materials/Material_${s.id}>
}

`}function V(e,t,s,n){if(n)return N(e,t,s,n);const o="Object_"+e.id,i=A(e.matrixWorld);return e.matrixWorld.determinant()<0&&console.warn("THREE.USDZExporter: USDZ does not support negative scales",e),`def Xform "${o}" (
	prepend references = @./geometries/Geometry_${t.id}.usda@</Geometry>
	prepend apiSchemas = ["MaterialBindingAPI"]
)
{
	matrix4d xformOp:transform = ${i}
	uniform token[] xformOpOrder = ["xformOp:transform"]

	rel material:binding = </Materials/Material_${s.id}>
}

`}function A(e){const t=e.elements;return`( ${S(t,0)}, ${S(t,4)}, ${S(t,8)}, ${S(t,12)} )`}function S(e,t){return`(${e[t+0]}, ${e[t+1]}, ${e[t+2]}, ${e[t+3]})`}function X(e){return`
def "Geometry"
{
${G(e)}
}
`}function G(e){const t="Geometry",s=e.attributes,n=s.position.count;return`
	def Mesh "${t}"
	{
		int[] faceVertexCounts = [${j(e)}]
		int[] faceVertexIndices = [${W(e)}]
		normal3f[] normals = [${v(s.normal,n,4)}] (
			interpolation = "vertex"
		)
		point3f[] points = [${v(s.position,n,6)}]
${Y(s)}
		uniform token subdivisionScheme = "none"
	}
`}function j(e){const t=e.index!==null?e.index.count:e.attributes.position.count;return Array(t/3).fill(3).join(", ")}function W(e){const t=e.index,s=[];if(t!==null)for(let n=0;n<t.count;n++)s.push(t.getX(n));else{const n=e.attributes.position.count;for(let o=0;o<n;o++)s.push(o)}return s.join(", ")}const b=(e,t)=>{const s=e.toPrecision(t);return s.indexOf("e")<0&&s.indexOf(".")>=0?s.replace(/0+$/,"").replace(/\.$/,""):s};function v(e,t,s=$){if(e===void 0)return console.warn("USDZExporter: Normals missing."),Array(t).fill("(0, 0, 0)").join(", ");const n=[];for(let o=0;o<e.count;o++){const i=e.getX(o),u=e.getY(o),r=e.getZ(o);n.push(`(${b(i,s)}, ${b(u,s)}, ${b(r,s)})`)}return n.join(", ")}function B(e){const t=[];for(let s=0;s<e.count;s++){const n=e.getX(s),o=e.getY(s);t.push(`(${n.toPrecision($)}, ${1-o.toPrecision($)})`)}return t.join(", ")}function Y(e){let t="";for(let n=0;n<4;n++){const o=n>0?n:"",i=e["uv"+o];i!==void 0&&(t+=`
		texCoord2f[] primvars:st${o} = [${B(i)}] (
			interpolation = "vertex"
		)`)}const s=e.color;if(s!==void 0){const n=s.count;t+=`
	color3f[] primvars:displayColor = [${v(s,n)}] (
		interpolation = "vertex"
		)`}return t}function q(e,t,s=!1){const n=[];for(const o in e){const i=e[o];n.push(J(i,t,s))}return`def "Materials"
{
${n.join("")}
}

`}function Q(e){const t=e.normalScale?e.normalScale.x:1;return`float4 inputs:scale = (${(2*t).toFixed(4)}, ${(2*t).toFixed(4)}, 2, 1)
			float4 inputs:bias = (${(-t).toFixed(4)}, ${(-t).toFixed(4)}, -1, 0)`}function J(e,t,s=!1){const n="			",o=[],i=[];function u(r,h,a){const c=r.source.id+"_"+r.flipY;t[c]=r;const f=r.channel>0?"st"+r.channel:"st",l={1e3:"repeat",1001:"clamp",1002:"mirror"},d=r.repeat.clone(),p=r.offset.clone(),g=r.rotation,T=Math.sin(g),P=Math.cos(g);return p.y=1-p.y-d.y,s?(p.x=p.x/d.x,p.y=p.y/d.y,p.x+=T/d.x,p.y+=P-1):(p.x+=T*d.x,p.y+=(1-P)*d.y),`
		def Shader "PrimvarReader_${h}"
		{
			uniform token info:id = "UsdPrimvarReader_float2"
			float2 inputs:fallback = (0.0, 0.0)
			token inputs:varname = "${f}"
			float2 outputs:result
		}

		def Shader "Transform2d_${h}"
		{
			uniform token info:id = "UsdTransform2d"
			token inputs:in.connect = </Materials/Material_${e.id}/PrimvarReader_${h}.outputs:result>
			float inputs:rotation = ${(g*(180/Math.PI)).toFixed($)}
			float2 inputs:scale = ${O(d)}
			float2 inputs:translation = ${O(p)}
			float2 outputs:result
		}

		def Shader "Texture_${r.id}_${h}"
		{
			uniform token info:id = "UsdUVTexture"
			asset inputs:file = @textures/Texture_${c}.png@
			float2 inputs:st.connect = </Materials/Material_${e.id}/Transform2d_${h}.outputs:result>
			${a!==void 0?"float4 inputs:scale = "+K(a):""}
			${h==="normal"?Q(e):""}
			token inputs:sourceColorSpace = "${r.colorSpace===I?"raw":"sRGB"}"
			token inputs:wrapS = "${l[r.wrapS]}"
			token inputs:wrapT = "${l[r.wrapT]}"
			float outputs:r
			float outputs:g
			float outputs:b
			float3 outputs:rgb
			${e.transparent||e.alphaTest>0?"float outputs:a":""}
		}`}return e.side===U&&console.warn("THREE.USDZExporter: USDZ does not support double sided materials",e),e.map!==null?(o.push(`${n}color3f inputs:diffuseColor.connect = </Materials/Material_${e.id}/Texture_${e.map.id}_diffuse.outputs:rgb>`),e.transparent?o.push(`${n}float inputs:opacity.connect = </Materials/Material_${e.id}/Texture_${e.map.id}_diffuse.outputs:a>`):e.alphaTest>0&&(o.push(`${n}float inputs:opacity.connect = </Materials/Material_${e.id}/Texture_${e.map.id}_diffuse.outputs:a>`),o.push(`${n}float inputs:opacityThreshold = ${e.alphaTest}`)),i.push(u(e.map,"diffuse",e.color))):o.push(`${n}color3f inputs:diffuseColor = ${w(e.color)}`),e.emissiveMap!==null?(o.push(`${n}color3f inputs:emissiveColor.connect = </Materials/Material_${e.id}/Texture_${e.emissiveMap.id}_emissive.outputs:rgb>`),i.push(u(e.emissiveMap,"emissive",new M(e.emissive.r*e.emissiveIntensity,e.emissive.g*e.emissiveIntensity,e.emissive.b*e.emissiveIntensity)))):e.emissive.getHex()>0&&o.push(`${n}color3f inputs:emissiveColor = ${w(e.emissive)}`),e.normalMap!==null&&(o.push(`${n}normal3f inputs:normal.connect = </Materials/Material_${e.id}/Texture_${e.normalMap.id}_normal.outputs:rgb>`),i.push(u(e.normalMap,"normal"))),e.aoMap!==null&&(o.push(`${n}float inputs:occlusion.connect = </Materials/Material_${e.id}/Texture_${e.aoMap.id}_occlusion.outputs:r>`),i.push(u(e.aoMap,"occlusion",new M(e.aoMapIntensity,e.aoMapIntensity,e.aoMapIntensity)))),e.roughnessMap!==null?(o.push(`${n}float inputs:roughness.connect = </Materials/Material_${e.id}/Texture_${e.roughnessMap.id}_roughness.outputs:g>`),i.push(u(e.roughnessMap,"roughness",new M(e.roughness,e.roughness,e.roughness)))):o.push(`${n}float inputs:roughness = ${e.roughness}`),e.metalnessMap!==null?(o.push(`${n}float inputs:metallic.connect = </Materials/Material_${e.id}/Texture_${e.metalnessMap.id}_metallic.outputs:b>`),i.push(u(e.metalnessMap,"metallic",new M(e.metalness,e.metalness,e.metalness)))):o.push(`${n}float inputs:metallic = ${e.metalness}`),e.alphaMap!==null?(o.push(`${n}float inputs:opacity.connect = </Materials/Material_${e.id}/Texture_${e.alphaMap.id}_opacity.outputs:r>`),o.push(`${n}float inputs:opacityThreshold = 0.0001`),i.push(u(e.alphaMap,"opacity"))):o.push(`${n}float inputs:opacity = ${e.opacity}`),e.isMeshPhysicalMaterial&&(e.clearcoatMap!==null?(o.push(`${n}float inputs:clearcoat.connect = </Materials/Material_${e.id}/Texture_${e.clearcoatMap.id}_clearcoat.outputs:r>`),i.push(u(e.clearcoatMap,"clearcoat",new M(e.clearcoat,e.clearcoat,e.clearcoat)))):o.push(`${n}float inputs:clearcoat = ${e.clearcoat}`),e.clearcoatRoughnessMap!==null?(o.push(`${n}float inputs:clearcoatRoughness.connect = </Materials/Material_${e.id}/Texture_${e.clearcoatRoughnessMap.id}_clearcoatRoughness.outputs:g>`),i.push(u(e.clearcoatRoughnessMap,"clearcoatRoughness",new M(e.clearcoatRoughness,e.clearcoatRoughness,e.clearcoatRoughness)))):o.push(`${n}float inputs:clearcoatRoughness = ${e.clearcoatRoughness}`),o.push(`${n}float inputs:ior = ${e.ior}`)),`
	def Material "Material_${e.id}"
	{
		def Shader "PreviewSurface"
		{
			uniform token info:id = "UsdPreviewSurface"
${o.join(`
`)}
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}

		token outputs:surface.connect = </Materials/Material_${e.id}/PreviewSurface.outputs:surface>

${i.join(`
`)}

	}
`}function w(e){return`(${e.r}, ${e.g}, ${e.b})`}function K(e){return`(${e.r}, ${e.g}, ${e.b}, 1.0)`}function O(e){return`(${e.x}, ${e.y})`}function ee(e){const t=e.name?e.name:"Camera_"+e.id,s=A(e.matrixWorld);return e.matrixWorld.determinant()<0&&console.warn("THREE.USDZExporter: USDZ does not support negative scales",e),e.isOrthographicCamera?`def Camera "${t}"
		{
			matrix4d xformOp:transform = ${s}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${e.near.toPrecision($)}, ${e.far.toPrecision($)})
			float horizontalAperture = ${((Math.abs(e.left)+Math.abs(e.right))*10).toPrecision($)}
			float verticalAperture = ${((Math.abs(e.top)+Math.abs(e.bottom))*10).toPrecision($)}
			token projection = "orthographic"
		}
	
	`:`def Camera "${t}"
		{
			matrix4d xformOp:transform = ${s}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${e.near.toPrecision($)}, ${e.far.toPrecision($)})
			float focalLength = ${e.getFocalLength().toPrecision($)}
			float focusDistance = ${e.focus.toPrecision($)}
			float horizontalAperture = ${e.getFilmWidth().toPrecision($)}
			token projection = "perspective"
			float verticalAperture = ${e.getFilmHeight().toPrecision($)}
		}
	
	`}export{oe as USDZAnimExporter};
