<?php

namespace SitebillApps\Sitebill\Hello\Models;

use Sitebill\AppSdk\AppModel;

class Greeting extends AppModel
{
    protected $table = 'app_sitebill_hello_greetings';

    protected $fillable = ['text'];
}
