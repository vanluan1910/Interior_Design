using InteriorDesign.Application.Interfaces;
using InteriorDesign.Infrastructure.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace InteriorDesign.Infrastructure.Services;

public sealed class EmailService(IOptions<SmtpSettings> options, ILogger<EmailService> logger) : IEmailService
{
    private readonly SmtpSettings _settings = options.Value;

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Host))
        {
            logger.LogInformation("SMTP not configured. Skipping email to {To}: {Subject}", to, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            client.CheckCertificateRevocation = false;
            await client.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls, cancellationToken);
            if (!string.IsNullOrWhiteSpace(_settings.Username))
            {
                await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);
            }
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
            logger.LogInformation("OTP Email successfully sent to {To}", to);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}: {Message}", to, ex.Message);
            throw;
        }
    }
}
