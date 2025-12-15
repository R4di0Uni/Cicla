#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "HX711.h"
#include <MPU6050.h>
#include <ESP32Servo.h>


const char* ssid = "Redmi 14C";
const char* password = "korekara";
const char* mqtt_server = "10.103.72.177";

WiFiClient espClient;
PubSubClient client(espClient);

#define SERVO_CHANNEL 4
#define BUZZER_CHANNEL 7


#define SERVO_PIN 27

#define BUZZER_PIN 26
#define REED_PIN   17

#define LOCK_ANGLE   0     
#define UNLOCK_ANGLE 90    


#define HX_SCK 19
#define HX_DT  23

#define SDA_PIN 21
#define SCL_PIN 22

HX711 scale;
MPU6050 mpu;
Servo lockServo;

bool isUnlocked = false; 



void callback(char* topic, byte* payload, unsigned int length) {
  String cmd = "";

  for (int i = 0; i < length; i++) {
    cmd += (char)payload[i];
  }

  Serial.print("Received cmd: ");
  Serial.println(cmd);

  if (cmd == "beep") {
  ledcWriteTone(BUZZER_PIN, 1500); // beep
  delay(300);
  ledcWriteTone(BUZZER_PIN, 0);    // silence
}



  if (cmd == "slot1_unlock") {
    lockServo.write(UNLOCK_ANGLE);
    isUnlocked = true;
    Serial.println("Slot 1 UNLOCKED");
  }

  if (cmd == "slot1_lock") {
    lockServo.write(LOCK_ANGLE);
    isUnlocked = false;
    Serial.println("Slot 1 LOCKED");
  }
}


void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe("esp32/cmd");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 seconds");
      delay(2000);
    }
  }
}

void setup() {

  int balancing_factor = -462.67;
  Serial.begin(115200);

  // Passive buzzer (LEDC)
ledcAttach(BUZZER_PIN, 2000, 8);   // pin, base freq, resolution
ledcWriteTone(BUZZER_PIN, 0);      // silent by default



  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

 scale.begin(HX_DT, HX_SCK);

scale.set_scale(balancing_factor);   
scale.tare();               
Serial.println("HX711 calibrated");

  Wire.begin(SDA_PIN, SCL_PIN, 400000);
  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("MPU6050 NOT connected!");
  } else {
    Serial.println("MPU6050 connected");
  }

  lockServo.attach(SERVO_PIN);
  lockServo.write(LOCK_ANGLE);

}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  int reedState = digitalRead(REED_PIN); 

  float weight = scale.get_units(10);

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  char payload[200];
  sprintf(payload,
  "{\"reed\":%d, \"weight\":%.2f, \"lock\":%d, \"ax\":%d, \"ay\":%d, \"az\":%d, \"gx\":%d, \"gy\":%d, \"gz\":%d}",
  reedState, weight, isUnlocked, ax, ay, az, gx, gy, gz
);


  client.publish("esp32/sensors", payload);

  Serial.println(payload);

  delay(500);  
}
