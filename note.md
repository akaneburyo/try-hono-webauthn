## 方針

- 認証は session 方式にする
- HttpOnlyCookie でやり取り、session 管理は D1 を使う
- WebAuthn にのみ対応する(パスワード認証はしない)

## 必要になるもの

- frontend

  - /signup (ユーザー登録&パスキー登録する画面)
  - /login (ログイン)
  - / (ログイン後の画面)

- backend
  - post /register ユーザー登録
  - get /auth/passkey/options options を返す(ユーザー情報を含まない)
  - get /auth/passkey/register-options session を元に、ユーザー情報を含む options を返す　 ↑ とまとめてもいいかも。(session がなかったら user 情報は返さない)
  - post /auth/passkey/register パスキー認証を登録
  - post /auth/passkey/verify パスキーで認証
  - post /logout ログアウト

## 必要なこと

- db 接続
  - users { id: random, name: string, session: random }
  - devices { user_id: users.id, credentialPublicKey, credentialID, counter, transports: body.response.transports }
- session 管理
  - Cookie で渡す

## Steps

- [x] 環境作る
      node のバージョン差で起動せず苦戦

- [x] ユーザー登録できるようにする

  - フロントエンドから通信できる
  - backend で DB を扱える

- [x] Session を管理できるようにする
- [x] session を使って認証できるようにする(リダイレクトをかけたりする)
- [x] ログアウトさせる

- [x] パスキーのオプションを返す
- [x] パスキー認証登録のフローを組む
- [x] パスキー認証のフローを組む
