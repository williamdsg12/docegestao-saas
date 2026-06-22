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

/**
 * Sends a 6-digit financial password recovery code
 */
export async function sendFinancialPasswordResetCode(to: string, code: string) {
    const html = `
  <div style="font-family: Arial, sans-serif; background:#fff; padding:40px; text-align:center; border: 1px solid #f8e9d2; border-radius: 20px; max-width: 600px; margin: 0 auto;">
    <h2 style="color:#6B1F12; font-weight: 900; text-transform: uppercase; font-style: italic;">DoceGestão Pro</h2>
    <div style="padding: 20px 0;">
        <p style="font-size:18px; font-weight: bold; color: #333;">Olá!</p>
        <p style="font-size:16px; color: #666;">Você solicitou a recuperação da sua <strong>Senha Financeira</strong>.</p>
        <p style="color: #666;">Use o código de segurança de 6 dígitos abaixo para prosseguir com a redefinição:</p>
        <div style="margin: 30px 0; background: #fdf8f5; border: 2px dashed #F47C52; padding: 20px; border-radius: 16px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #6B1F12; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #e11d48; font-weight: bold;">Este código é válido por 10 minutos.</p>
    </div>
    <p style="font-size:12px; color:#aaa; margin-top:30px; border-top: 1px solid #eee; padding-top: 20px;">
      Se você não solicitou essa redefinição, altere suas credenciais ou entre em contato com nosso suporte imediatamente.
    </p>
  </div>`

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "🔐 Código de Recuperação Financeira - DoceGestão Pro",
        html,
    })
}

/**
 * Sends a security alert notification when financial settings are updated
 */
export async function sendFinancialSecurityAlert(to: string, actionName: string, ipAddress: string) {
    const formattedDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    
    const html = `
  <div style="font-family: Arial, sans-serif; background:#fff; padding:40px; border: 1px solid #fee2e2; border-radius: 20px; max-width: 600px; margin: 0 auto;">
    <h2 style="color:#e11d48; font-weight: 900; text-transform: uppercase; font-style: italic; text-align: center;">Alerta de Segurança Financeira</h2>
    <div style="padding: 20px 0; color: #333;">
        <p style="font-size:16px; font-weight: bold;">Olá,</p>
        <p style="font-size:14px; line-height: 1.6;">
            Detectamos que uma alteração importante foi realizada nas suas configurações financeiras:
        </p>
        <div style="margin: 20px 0; background: #fff5f5; border-left: 4px solid #e11d48; padding: 15px; border-radius: 4px;">
            <strong>Ação:</strong> ${actionName}<br/>
            <strong>Data/Hora:</strong> ${formattedDate} (Horário de Brasília)<br/>
            <strong>Endereço IP:</strong> ${ipAddress || "Desconhecido"}
        </div>
        <p style="font-size:14px; line-height: 1.6; color: #666;">
            Se você mesmo realizou essa ação, nenhuma providência é necessária.
        </p>
        <p style="font-size:14px; line-height: 1.6; color: #e11d48; font-weight: bold;">
            Se você NÃO realizou essa alteração, entre em contato imediatamente com nossa equipe de suporte para congelar sua conta!
        </p>
    </div>
    <p style="font-size:11px; color:#aaa; margin-top:30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
      Este é um e-mail automático enviado por motivos de segurança. Não responda a este e-mail.
    </p>
  </div>`

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "⚠️ ALERTA DE SEGURANÇA FINANCEIRA - DoceGestão Pro",
        html,
    })
}
