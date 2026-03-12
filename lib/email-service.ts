import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // false → STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
})

export async function sendResetEmail(to: string, token: string) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    const html = `
  <div style="font-family: Arial, sans-serif; background:#fff; padding:40px; text-align:center; border: 1px solid #f0f0f0; border-radius: 20px; max-width: 600px; margin: 0 auto;">
    <h2 style="color:#f73a80; font-weight: 900; text-transform: uppercase; font-style: italic;">DoceGestão Pro</h2>
    <div style="padding: 20px 0;">
        <p style="font-size:18px; font-weight: bold; color: #333;">Olá Confeiteira(o)!</p>
        <p style="font-size:16px; color: #666;">Recebemos um pedido para redefinir sua senha.</p>
        <p style="color: #666;">Clique no botão abaixo para criar uma nova senha:</p>
        <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background:#f73a80; color:white; padding:16px 32px; border-radius:12px; text-decoration:none; display:inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(247, 58, 128, 0.3);">
                Redefinir Minha Senha
            </a>
        </div>
    </div>
    <p style="font-size:12px; color:#aaa; margin-top:30px; border-top: 1px solid #eee; padding-top: 20px;">
      Se você não solicitou essa redefinição, apenas ignore este e-mail.<br/>
      Este link expira automaticamente em 1 hora por segurança.
    </p>
  </div>`

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "🔐 Redefinição de senha - DoceGestão Pro",
        html,
    })
}
