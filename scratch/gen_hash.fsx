#r "nuget: BCrypt.Net-Next, 4.2.0"

let hash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 11)
let verified = BCrypt.Net.BCrypt.Verify("Admin@123", hash)
printfn "HASH:%s" hash
printfn "VERIFIED:%b" verified
