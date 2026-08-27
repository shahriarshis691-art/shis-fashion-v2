const fs = require('fs')
const s = fs.readFileSync('src/components/shop/AarongProductCard.tsx', 'utf8')
const i = s.indexOf('}: AarongProductCardProps)')
console.log(s.slice(i, i + 900))
