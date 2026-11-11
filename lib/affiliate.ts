/** Central catalog: edit this file to manage affiliate products and their destinations.
 * Replace sample records with verified products and your own approved affiliate URLs.
 * Never invent endorsements, prices, ratings, or discount claims.
 */
export type AffiliateProduct={id:string;name:string;brand:string;category:'EDC'|'Bags'|'Lighting'|'Preparedness'|'Tools';description:string;image:string;merchant:string;affiliateUrl:string;videoId?:string;featured?:boolean};
export const affiliateProducts:AffiliateProduct[]=[
 {id:'edc-setup',name:'Everyday Carry Essentials',brand:'Marine X Gear Guide',category:'EDC',description:'A curated starting point for practical daily carry. Product links are being prepared.',image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85',merchant:'Retailer to be confirmed',affiliateUrl:'',featured:true},
 {id:'carry-bags',name:'Bags & Loadout Picks',brand:'Marine X Gear Guide',category:'Bags',description:'Find practical carry options for work, travel, and everyday use.',image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85',merchant:'Retailer to be confirmed',affiliateUrl:'',featured:true},
 {id:'preparedness',name:'Preparedness Essentials',brand:'Marine X Gear Guide',category:'Preparedness',description:'Explore useful equipment for everyday readiness.',image:'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=85',merchant:'Retailer to be confirmed',affiliateUrl:'',featured:true}
];
export function isValidAffiliateUrl(url:string){try{const u=new URL(url);return u.protocol==='https:'&&Boolean(u.hostname)&&!['example.com','localhost'].includes(u.hostname)}catch{return false}}
