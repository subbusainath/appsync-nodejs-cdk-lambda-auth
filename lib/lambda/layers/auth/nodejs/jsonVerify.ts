import { readFileSync } from "fs"
export { verify, sign } from "jsonwebtoken"
export const wand = readFileSync('/opt/nodejs/uNeedMe.pub', 'utf-8')


