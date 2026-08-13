<?php

namespace App\Mail;

use App\Models\Unity;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Recordatorio enviado un día antes de una cita, vacuna o desparasitación programada. */
class RecordatorioCita extends Mailable
{
    use SerializesModels;

    public function __construct(
        public string $paciente,
        public string $propietario,
        public string $motivo,
        public string $fecha,
        public ?Unity $clinica,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Recordatorio: {$this->motivo} de {$this->paciente} mañana",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mails.recordatorio');
    }
}
