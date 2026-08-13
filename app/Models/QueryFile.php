<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Documento adjunto a una consulta (resultados de laboratorio, RX, etc.). */
class QueryFile extends Model
{
    protected $table = 'query_files';

    /** La tabla heredada usa `uploaded_at` en lugar de timestamps de Laravel. */
    public $timestamps = false;

    protected $fillable = ['query_id', 'file_path', 'uploaded_at'];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'date',
        ];
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(Query::class, 'query_id');
    }

    public function getExtensionAttribute(): string
    {
        return mb_strtolower(pathinfo((string) $this->file_path, PATHINFO_EXTENSION));
    }

    public function getEsImagenAttribute(): bool
    {
        return in_array($this->extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'], true);
    }

    public function getEsVideoAttribute(): bool
    {
        return in_array($this->extension, ['mp4', 'webm', 'ogg', 'mov', 'avi'], true);
    }

    public function getEsPdfAttribute(): bool
    {
        return $this->extension === 'pdf';
    }
}
