const nodemailer = require("nodemailer");
(async () => {
  const t = nodemailer.createTransport({
    host: process.env.EMAIL_HOSTING_SERVICE,
    secure: true,
    auth: { user: process.env.EMAIL_USER_NAME, pass: process.env.EMAIL_PASS },
  });
  try {
    const r = await t.sendMail({
      from: process.env.EMAIL_USER_NAME,
      to: process.env.EMAIL_USER_NAME,
      subject: "test",
      text: "test",
    });
    console.log("ok", r.messageId);
  } catch (e) {
    console.error(e);
  }
})();