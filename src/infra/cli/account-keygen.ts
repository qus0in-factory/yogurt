import { generateAccountKey } from '../accounts/account-key.ts'

const key = generateAccountKey()
console.log(key)
console.error('이 키를 안전한 곳(비밀번호 관리자)에 백업하세요. 잃어버리면 저장된 계좌 키를 복구할 수 없습니다.')
