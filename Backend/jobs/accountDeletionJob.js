const cron = require('node-cron');

function getStatusMeta(status) {
  switch (status) {
    case 'ESCALATED':
      return {
        color: '#3b82f6',
        bgTint: 'rgba(59,130,246,0.12)',
        glow:
          'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 60%)'
      };

    case 'CANCELLED':
      return {
        color: '#f59e0b',
        bgTint: 'rgba(245,158,11,0.12)',
        glow:
          'radial-gradient(circle at top, rgba(245,158,11,0.18), transparent 60%)'
      };

    case 'RESOLVED':
      return {
        color: '#22c55e',
        bgTint: 'rgba(34,197,94,0.12)',
        glow:
          'radial-gradient(circle at top, rgba(34,197,94,0.18), transparent 60%)'
      };

    default:
      return {
        color: '#737373',
        bgTint: 'rgba(115,115,115,0.12)',
        glow: 'none'
      };
  }
}

module.exports = (
  Request,
  User,
  sendRequestEmail
) => {
  cron.schedule('*/5 * * * *', async () => {
    const requests = await Request.find({
      type: 'account_deletion',
      status: 'ESCALATED',
      executeAfter: {
        $lte: new Date()
      }
    });

    for (const request of requests) {
      try {
        const user = await User.findOne({
          id: request.id
        });

        if (!user) {
          request.status = 'RESOLVED';
          await request.save();
          continue;
        }

        request.status = 'RESOLVED';
        request.reviewed = 'true';
        request.completedAt = new Date();

        request.reviewMessage =
          'Your account deletion request has been automatically processed after the 24-hour waiting period.';

        await request.save();

        await sendRequestEmail(
          request,
          user,
          getStatusMeta
        );

        await User.deleteOne({ id: user.id });
        await Request.deleteMany({ id: user.id });

        if (process.env.DISCORD_WEBHOOK_URL1) {
          try {
            await fetch(process.env.DISCORD_WEBHOOK_URL1, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                embeds: [
                  {
                    title: 'Account Deleted',
                    description: `**${user.username}** (${user.id})'s account was deleted`,
                    color: 15158332, // Soft Red color
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
          } catch (webhookErr) {
            console.error('Failed to send Discord webhook:', webhookErr);
          }
        }

      } catch (err) {
        console.error(err);
      }
    }
  });
};
